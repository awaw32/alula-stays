import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
// expireUnpaidSession (Webhook الدفع) معرّفة هنا لأن ملف payments يعمل بـ node
import type { Doc } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import {
  type DatabaseCtx,
  requireAnyRole,
  requireBookingAccess,
  requireRole,
  requireUser,
} from "./lib/authorization";
import { isApartmentLive } from "./admin";
import { overlapsBlockedDates } from "./calendar";
import {
  validateBookingDates,
  validateGuests,
  validatePrice,
} from "./lib/validation";
import {
  calculateStayPrice,
  meetsMinNights,
} from "../lib/pricing";
import {
  ERROR_MESSAGES,
  ValidationError,
  assertExists,
} from "./lib/errors";
import {
  calculatePlatformFee,
  calculateRefund,
} from "./lib/money";
import { checkRateLimit } from "./lib/rateLimiting";

const bookingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("completed"),
);

const PENDING_TIMEOUT_MS = 30 * 60 * 1000; // مهلة 30 دقيقة للحجز المعلق غير المدفوع قبل فك حجب التواريخ

export function isBookingActive(booking: Doc<"bookings">, now: number = Date.now()): boolean {
  if (booking.status === "cancelled") return false;
  // الحجز المعلق وغير المدفوع يسقط بعد 30 دقيقة لعدم حجب الشقة للأبد
  if (
    booking.status === "pending" &&
    booking.paymentStatus === "unpaid" &&
    now - booking.createdAt > PENDING_TIMEOUT_MS
  ) {
    return false;
  }
  return true;
}

async function enrichBooking(ctx: DatabaseCtx, booking: Doc<"bookings">) {
  const apartment = await ctx.db.get(booking.apartmentId);
  return { ...booking, apartment };
}

/**
 * إنهاء جلسة دفع منتهية (يستدعى من Stripe Webhook فقط):
 * يلغي الحجز غير المدفوع بعد انتهاء جلسة الدفع.
 */
export const expireUnpaidSession = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return { expired: false };

    if (
      booking.paymentStatus !== "unpaid" ||
      booking.paymentSessionId !== args.sessionId ||
      booking.status !== "pending"
    ) {
      return { expired: false };
    }

    await ctx.db.patch(args.bookingId, { status: "cancelled" });
    return { expired: true };
  },
});

async function enrichBookings(
  ctx: DatabaseCtx,
  bookings: Doc<"bookings">[],
) {
  return Promise.all(bookings.map((booking) => enrichBooking(ctx, booking)));
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return enrichBookings(ctx, bookings);
  },
});

export const adminList = query({
  args: { status: v.optional(bookingStatusValidator) },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    const bookings = args.status
      ? await ctx.db
          .query("bookings")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("bookings").order("desc").collect();

    return enrichBookings(ctx, bookings);
  },
});

export const get = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const { booking } = await requireBookingAccess(ctx, args.bookingId);
    return enrichBooking(ctx, booking);
  },
});

export const checkAvailability = query({
  args: {
    apartmentId: v.id("apartments"),
    checkIn: v.number(),
    checkOut: v.number(),
  },
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.checkIn) || !Number.isFinite(args.checkOut)) {
      return { available: false };
    }

    if (args.checkOut <= args.checkIn) {
      return { available: false };
    }

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment || !isApartmentLive(apartment)) {
      return { available: false };
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const now = Date.now();
    const hasOverlap = bookings.some(
      (booking) =>
        isBookingActive(booking, now) &&
        args.checkIn < booking.checkOut &&
        args.checkOut > booking.checkIn,
    );

    if (hasOverlap) {
      return { available: false };
    }

    // التواريخ المحجوبة يدوياً من المالك
    const blocked = await overlapsBlockedDates(ctx, args.apartmentId, args.checkIn, args.checkOut);

    return { available: !blocked };
  },
});

export const create = mutation({
  args: {
    apartmentId: v.id("apartments"),
    checkIn: v.number(),
    checkOut: v.number(),
    guests: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // التحقق من تسجيل الدخول
      const user = await requireUser(ctx);

      // التحقق من معدل الطلبات
      if (!checkRateLimit(user._id, "BOOKING")) {
        throw new ValidationError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      }

      // جلب الشقة والتحقق من وجودها
      const apartmentData = await ctx.db.get(args.apartmentId);
      if (!apartmentData) {
        throw new ValidationError(ERROR_MESSAGES.APARTMENT_NOT_FOUND);
      }
      const apartment = apartmentData;

      // التحقق من أن الشقة متاحة
      if (apartment.available === false) {
        throw new ValidationError(ERROR_MESSAGES.APARTMENT_UNAVAILABLE);
      }

      // التحقق من أن الشقة معتمدة ومنشورة (حالة دورة الحياة الجديدة أو isVerified للشقق القديمة)
      if (!isApartmentLive(apartment)) {
        throw new ValidationError(ERROR_MESSAGES.APARTMENT_NOT_VERIFIED);
      }

      // منع المالك من حجز شقته الخاصة
      if (apartment.ownerId === user._id) {
        throw new ValidationError(ERROR_MESSAGES.APARTMENT_OWN_BOOKING);
      }

      // التحقق من صحة السعر
      validatePrice(apartment.price);

      // التحقق من صحة التواريخ
      const totalNights = validateBookingDates(args.checkIn, args.checkOut);

      // الحد الأدنى لعدد الليالي (افتراضياً 1 إن لم يحدده المالك)
      if (!meetsMinNights(args.checkIn, args.checkOut, apartment.minNights)) {
        throw new ValidationError(
          `الحد الأدنى للإقامة في هذه الشقة ${apartment.minNights} ليالٍ`,
        );
      }

      // التحقق من صحة عدد الضيوف
      validateGuests(args.guests, apartment.maxGuests);

      // التحقق من عدم وجود حجوزات متعارضة
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
        .collect();

      const now = Date.now();
      const hasOverlap = bookings.some(
        (booking) =>
          isBookingActive(booking, now) &&
          args.checkIn < booking.checkOut &&
          args.checkOut > booking.checkIn,
      );

      if (hasOverlap) {
        throw new ValidationError(ERROR_MESSAGES.BOOKING_DATES_UNAVAILABLE);
      }

      // التحقق من عدم التقاطع مع تواريخ حجبها المالك (صيانة/حظر)
      const blockedOverlap = await overlapsBlockedDates(
        ctx,
        args.apartmentId,
        args.checkIn,
        args.checkOut,
      );
      if (blockedOverlap) {
        throw new ValidationError(ERROR_MESSAGES.BOOKING_DATES_UNAVAILABLE);
      }

      // حساب الأسعار بأمان — مع سعر نهاية الأسبوع إن حدده المالك
      const stayPrice = calculateStayPrice(
        args.checkIn,
        args.checkOut,
        apartment.price,
        apartment.weekendPrice,
      );
      const totalPrice = stayPrice.totalPrice;
      const platformFee = calculatePlatformFee(totalPrice, 10); // 10% رسوم

      // إنشاء الحجز
      const bookingId = await ctx.db.insert("bookings", {
        apartmentId: args.apartmentId,
        userId: user._id,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        guests: args.guests,
        totalNights,
        pricePerNight: apartment.price,
        totalPrice,
        platformFee,
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: Date.now(),
      });

      return { bookingId, totalPrice, platformFee, totalNights };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ValidationError(
        error instanceof Error ? error.message : "فشل إنشاء الحجز"
      );
    }
  },
});

export const confirm = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    try {
      await requireRole(ctx, "admin");
      const bookingData = await ctx.db.get(args.bookingId);

      if (!bookingData) {
        throw new ValidationError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      }
      const booking = bookingData;

      if (booking.status !== "pending") {
        throw new ValidationError(ERROR_MESSAGES.BOOKING_CANNOT_CONFIRM);
      }

      await ctx.db.patch(args.bookingId, {
        status: "confirmed",
        paymentStatus: "paid",
      });

      return "تم تأكيد الحجز";
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        error instanceof Error ? error.message : "فشل تأكيد الحجز"
      );
    }
  },
});

export const cancel = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    try {
      const { user, booking } = await requireBookingAccess(ctx, args.bookingId);

      // التحقق من الصلاحيات
      if (user.role !== "admin" && booking.userId !== user._id) {
        throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      // التحقق من أن الحجز قابل للإلغاء
      if (booking.status === "cancelled" || booking.status === "completed") {
        throw new ValidationError(ERROR_MESSAGES.BOOKING_CANNOT_CANCEL);
      }

      // حساب الوقت المتبقي قبل تاريخ الوصول
      const hoursUntilCheckin = (booking.checkIn - Date.now()) / (1000 * 60 * 60);

      // حساب الاسترجاع بأمان
      const { refundPercentage, refundAmount, feeRefund } = calculateRefund(
        booking.totalPrice,
        booking.platformFee,
        hoursUntilCheckin
      );

      // تحديد حالة الدفع بناءً على الاسترجاع
      const paymentStatus =
        booking.paymentStatus !== "paid"
          ? "unpaid"
          : refundPercentage === 100
            ? "refunded"
            : "paid";

      // تحديث الحجز
      await ctx.db.patch(args.bookingId, {
        status: "cancelled",
        paymentStatus,
      });

      // رسالة نتيجة واضحة
      const getMessage = () => {
        if (refundPercentage === 100) {
          return "تم الإلغاء واسترداد المبلغ بالكامل";
        }
        if (refundPercentage === 50) {
          return "تم الإلغاء واسترداد 50% من المبلغ";
        }
        return "تم الإلغاء بدون استرداد (أقل من 24 ساعة)";
      };

      return {
        cancelled: true,
        refundPercentage,
        refundAmount,
        feeRefund,
        message: getMessage(),
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        error instanceof Error ? error.message : "فشل إلغاء الحجز"
      );
    }
  },
});

export const ownerBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAnyRole(ctx, ["owner", "admin"]);
    const apartments =
      user.role === "admin"
        ? await ctx.db.query("apartments").collect()
        : await ctx.db
            .query("apartments")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();

    if (apartments.length === 0) {
      return [];
    }

    const bookings = (
      await Promise.all(
        apartments.map((apartment) =>
          ctx.db
            .query("bookings")
            .withIndex("by_apartment", (q) => q.eq("apartmentId", apartment._id))
            .collect(),
        ),
      )
    ).flat();

    const enriched = await enrichBookings(ctx, bookings);
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    const allBookings = await ctx.db.query("bookings").collect();
    const now = Date.now();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).getTime();

    const monthlyBookings = allBookings.filter(
      (booking) => booking.createdAt >= monthStart,
    );
    const activeBookings = allBookings.filter(
      (booking) => booking.status === "confirmed" && booking.checkOut > now,
    );
    const totalRevenue = allBookings
      .filter((booking) => booking.paymentStatus === "paid")
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    const platformRevenue = allBookings
      .filter((booking) => booking.paymentStatus === "paid")
      .reduce((sum, booking) => sum + booking.platformFee, 0);
    const monthlyRevenue = monthlyBookings
      .filter((booking) => booking.paymentStatus === "paid")
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    return {
      total: allBookings.length,
      active: activeBookings.length,
      totalRevenue,
      platformRevenue,
      monthlyBookings: monthlyBookings.length,
      monthlyRevenue,
    };
  },
});

export const getPaymentContext = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }

    const apartment = await ctx.db.get(booking.apartmentId);
    const user = await ctx.db.get(booking.userId);
    return { booking, apartment, user };
  },
});

export const attachPaymentSession = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("الحجز غير موجود");
    }
    if (booking.status === "cancelled") {
      throw new Error("لا يمكن بدء الدفع لحجز ملغي");
    }

    await ctx.db.patch(args.bookingId, { paymentSessionId: args.sessionId });
  },
});

export const markPaid = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("الحجز غير موجود");
    }
    if (booking.paymentStatus === "paid" && booking.status === "confirmed") {
      return booking;
    }
    if (booking.status === "cancelled") {
      throw new Error("لا يمكن دفع حجز تم إلغاؤه");
    }

    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      paymentStatus: "paid",
      paymentSessionId: args.sessionId,
    });

    return await ctx.db.get(args.bookingId);
  },
});

export const applyCancellation = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    paymentStatus: v.union(
      v.literal("unpaid"),
      v.literal("paid"),
      v.literal("refunded"),
    ),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("الحجز غير موجود");
    }
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      paymentStatus: args.paymentStatus,
    });
    return await ctx.db.get(args.bookingId);
  },
});

