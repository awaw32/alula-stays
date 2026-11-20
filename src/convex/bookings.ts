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
import { calculatePlatformFee, calculateRefund } from "./lib/money";
import { checkRateLimit } from "./lib/rateLimiting";
import { normalizeSaudiPhone } from "./whatsapp";

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
  const guestUser = booking.userId ? await ctx.db.get(booking.userId) : null;
  const guestProfile = booking.userId
    ? await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", booking.userId!))
        .unique()
    : null;

  let ownerName: string | undefined;
  let ownerPhone: string | undefined;

  if (apartment?.ownerId) {
    const ownerId = apartment.ownerId;
    const ownerUser = await ctx.db.get(ownerId);
    const ownerProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", ownerId))
      .unique();
    ownerName = ownerUser?.name;
    ownerPhone = ownerProfile?.phone;
  }

  const invoiceNumber =
    booking.invoiceNumber ||
    `INV-${new Date(booking.createdAt).getFullYear()}-${booking._id.slice(-6).toUpperCase()}`;

  return {
    ...booking,
    invoiceNumber,
    apartment,
    guest: {
      name: booking.guestName || guestUser?.name || "ضيف العلا",
      phone: booking.guestPhone || guestProfile?.phone || "",
      email: booking.guestEmail || guestUser?.email || "",
    },
    owner: {
      name: ownerName || "مالك الشقة",
      phone: ownerPhone || "",
    },
  };
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

      const userProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      const year = new Date().getFullYear();
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      const invoiceNumber = `INV-${year}-${randomSeq}`;

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
        invoiceNumber,
        guestName: user.name || "ضيف العلا",
        guestPhone: userProfile?.phone || user.phone || "",
        guestEmail: user.email || "",
        createdAt: Date.now(),
      });

      // تسجيل بدء عملية الدفع في التحليلات
      try {
        await ctx.db.insert("siteAnalytics", {
          type: "checkout_started",
          path: `/apartment/${args.apartmentId}`,
          visitorId: `usr_${user._id}`,
          userId: user._id,
          apartmentId: args.apartmentId,
          bookingId,
          phone: userProfile?.phone || user.phone || undefined,
          completed: false,
          reminderSent: false,
          createdAt: Date.now(),
        });
      } catch {}

      // إشعار فوري لمالك الشقة
      if (apartment.ownerId) {
        await ctx.db.insert("notifications", {
          userId: apartment.ownerId,
          type: "booking_created",
          title: "طلب حجز جديد 🛎️",
          message: `طلب حجز جديد لشقتك "${apartment.titleAr || apartment.title}" من ${user.name || "ضيف"} بانتظار إتمام الدفع (فاتورة #${invoiceNumber})`,
          relatedBookingId: bookingId,
          relatedApartmentId: args.apartmentId,
          actionUrl: "/owner",
          read: false,
          createdAt: Date.now(),
        });

        // إشعار واتساب تلقائي لصاحب الشقة للرد بـ 1 (موافقة) أو 2 (رفض)
        try {
          const ownerDoc = await ctx.db.get(apartment.ownerId);
          const ownerProf = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", apartment.ownerId!))
            .unique();
          const rawOwnerPhone = ownerProf?.phone || ownerDoc?.phone;
          if (rawOwnerPhone) {
            const normOwnerPhone = normalizeSaudiPhone(rawOwnerPhone);
            if (normOwnerPhone) {
              const checkInDate = new Date(args.checkIn).toLocaleDateString("ar-SA");
              const checkOutDate = new Date(args.checkOut).toLocaleDateString("ar-SA");
              const guestDisplay = user.name || "ضيف العلا";
              const aptTitle = apartment.titleAr || apartment.title;

              const waMessage = `🛎️ لديك طلب حجز جديد في شقق العلا!\n\n` +
                `🏠 الشقة: ${aptTitle}\n` +
                `👤 الضيف: ${guestDisplay}\n` +
                `📅 الفترة: من ${checkInDate} إلى ${checkOutDate} (${totalNights} ليالٍ)\n` +
                `💰 إجمالي المبلغ: ${totalPrice.toLocaleString()} ر.س\n` +
                `🧾 رقم الفاتورة: #${invoiceNumber}\n\n` +
                `الرجاء الرد على هذه الرسالة:\n` +
                `1️⃣ للموافقة على الحجز ✅\n` +
                `2️⃣ لرفض الحجز ❌`;

              await ctx.db.insert("whatsappQueue", {
                ownerId: apartment.ownerId,
                apartmentId: args.apartmentId,
                bookingId,
                type: "booking_request",
                ownerPhone: normOwnerPhone,
                message: waMessage,
                status: "pending",
                createdAt: Date.now(),
              });
            }
          }
        } catch (waErr) {
          console.warn("[Booking] Error enqueuing owner WhatsApp message:", waErr);
        }

        // إشعار واتساب تلقائي للضيف بتأكيد استلام طلبه
        const rawGuestPhone = userProfile?.phone || user.phone;
        if (rawGuestPhone) {
          const normGuestPhone = normalizeSaudiPhone(rawGuestPhone);
          if (normGuestPhone) {
            const checkInDate = new Date(args.checkIn).toLocaleDateString("ar-SA");
            const checkOutDate = new Date(args.checkOut).toLocaleDateString("ar-SA");
            const aptTitle = apartment.titleAr || apartment.title;
            const guestDisplay = user.name || "ضيف العلا";

            const guestWaMsg =
              `مرحباً بك ${guestDisplay}! 🌿\n\n` +
              `تم استلام طلب حجزك بنجاح في شقق العلا:\n` +
              `🏠 الوحدة: ${aptTitle}\n` +
              `📅 الفترة: من ${checkInDate} إلى ${checkOutDate} (${totalNights} ليالٍ)\n` +
              `💰 المبلغ الإجمالي: ${totalPrice.toLocaleString()} ر.س\n` +
              `🧾 رقم الفاتورة: #${invoiceNumber}\n\n` +
              `طلبك الآن بانتظار موافقة المالك، وسنوافيك برسالة فورية هنا بمجرد اعتماده لتأكيد الدفع 🌴✨`;

            await ctx.db.insert("whatsappQueue", {
              bookingId,
              apartmentId: args.apartmentId,
              ownerPhone: normGuestPhone,
              message: guestWaMsg,
              type: "booking_update",
              status: "pending",
              createdAt: Date.now(),
            });
          }
        }
      }

      // إشعار فوري لجميع مديري المنصة (Admins)
      const admins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();
      for (const admin of admins) {
        if (admin._id !== apartment.ownerId) {
          await ctx.db.insert("notifications", {
            userId: admin._id,
            type: "booking_created",
            title: "🛎️ طلب حجز جديد في المنصة",
            message: `حجز جديد لشقة "${apartment.titleAr || apartment.title}" من ${user.name || "ضيف"} بمبلغ ${totalPrice.toLocaleString()} ر.س (فاتورة #${invoiceNumber})`,
            relatedBookingId: bookingId,
            relatedApartmentId: args.apartmentId,
            actionUrl: "/admin",
            read: false,
            createdAt: Date.now(),
          });
        }
      }

      // إشعار واتساب فوري لرقم الإدارة المعتمد (966506709265)
      try {
        const aptTitle = apartment.titleAr || apartment.title;
        const guestDisplay = user.name || "ضيف العلا";
        const adminWaMsg =
          `🛎️ *حجز جديد في منصة شقق العلا*\n\n` +
          `🏠 *الشقة:* ${aptTitle}\n` +
          `👤 *الضيف:* ${guestDisplay}\n` +
          `💰 *المبلغ:* ${totalPrice.toLocaleString()} ر.س (عمولة المنصة: ${platformFee.toLocaleString()} ر.س)\n` +
          `🧾 *الفاتورة:* #${invoiceNumber}\n` +
          `🔗 https://alulahome.com/admin`;

        await ctx.db.insert("whatsappQueue", {
          bookingId,
          apartmentId: args.apartmentId,
          ownerPhone: "966506709265",
          message: adminWaMsg,
          type: "general",
          status: "pending",
          createdAt: Date.now(),
        });
      } catch {}

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

/**
 * قبول وموافقة المالك (أو الأدمن) على طلب الحجز المعلق مباشرة من لوحة التحكم
 */
export const ownerAcceptBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new ValidationError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const apartment = await ctx.db.get(booking.apartmentId);
    const isAdmin = user.role === "admin";
    const isOwner = apartment && apartment.ownerId === user._id;

    if (!isAdmin && !isOwner) {
      throw new ValidationError("غير مصرح لك بقبول هذا الحجز");
    }

    if (booking.status !== "pending") {
      throw new ValidationError("لا يمكن قبول حجز تمت معالجته مسبقاً");
    }

    const now = Date.now();
    await ctx.db.patch(bookingId, {
      status: "confirmed",
    });

    const invoiceNum = booking.invoiceNumber || `INV-${booking._id.slice(-6).toUpperCase()}`;

    // إشعار داخل المنصة للضيف
    if (booking.userId) {
      await ctx.db.insert("notifications", {
        userId: booking.userId,
        type: "booking_confirmed",
        title: "✅ تمت الموافقة على طلب حجزك!",
        message: `وافق المستضيف على طلب حجزك في "${apartment?.titleAr || apartment?.title || "العلا"}" (فاتورة #${invoiceNum}). يرجى إتمام السداد لتأكيد الإقامة.`,
        relatedBookingId: bookingId,
        relatedApartmentId: booking.apartmentId,
        actionUrl: `/my-bookings?booking=${bookingId}`,
        read: false,
        createdAt: now,
      });
    }

    // إرسال رسالة واتساب للضيف
    try {
      const guestPhone =
        booking.guestPhone ||
        (booking.userId ? (await ctx.db.get(booking.userId))?.phone : undefined);
      if (guestPhone) {
        const normPhone = normalizeSaudiPhone(guestPhone);
        const aptTitle = apartment?.titleAr || apartment?.title || "شقة في العلا";
        const checkInDate = new Date(booking.checkIn).toLocaleDateString("ar-SA");
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString("ar-SA");

        const guestMsg =
          `🎉 *بشرى سارة - تمت الموافقة على حجزك!*\n\n` +
          `وافق مالك الوحدة على طلب إقامتك في: *${aptTitle}*\n` +
          `📅 *الفترة:* من ${checkInDate} إلى ${checkOutDate}\n` +
          `💰 *المبلغ:* ${booking.totalPrice.toLocaleString()} ر.س\n` +
          `🧾 *الفاتورة:* #${invoiceNum}\n\n` +
          `يرجى الدخول وتأكيد السداد عبر الرابط:\n` +
          `🔗 https://alulahome.com/my-bookings?booking=${booking._id}\n\n` +
          `نتمنى لك أوقاتاً سعيدة في العلا! 🌴✨`;

        await ctx.db.insert("whatsappQueue", {
          bookingId: booking._id,
          apartmentId: booking.apartmentId,
          ownerPhone: normPhone,
          message: guestMsg,
          type: "booking_update",
          status: "pending",
          createdAt: now,
        });
      }
    } catch (e) {
      console.error("Failed to enqueue guest approval whatsapp message:", e);
    }

    return { success: true, message: "تمت الموافقة على الحجز بنجاح" };
  },
});

/**
 * رفض المالك (أو الأدمن) لطلب الحجز المعلق وإشعار الضيف وإتاحة التواريخ
 */
export const ownerRejectBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { bookingId, reason }) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new ValidationError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const apartment = await ctx.db.get(booking.apartmentId);
    const isAdmin = user.role === "admin";
    const isOwner = apartment && apartment.ownerId === user._id;

    if (!isAdmin && !isOwner) {
      throw new ValidationError("غير مصرح لك برفض هذا الحجز");
    }

    if (booking.status !== "pending") {
      throw new ValidationError("لا يمكن رفض حجز تمت معالجته مسبقاً");
    }

    const now = Date.now();
    await ctx.db.patch(bookingId, {
      status: "cancelled",
    });

    // إشعار داخل المنصة للضيف
    if (booking.userId) {
      await ctx.db.insert("notifications", {
        userId: booking.userId,
        type: "booking_cancelled",
        title: "نعتذر منك، تعذر قبول الحجز",
        message: `نعتذر منك، الشقة "${apartment?.titleAr || apartment?.title || "العلا"}" غير متاحة في التواريخ المطلوبة${reason ? ` (السبب: ${reason})` : ""}. يمكنك تصفح وحدات بديلة في العلا.`,
        relatedBookingId: bookingId,
        relatedApartmentId: booking.apartmentId,
        actionUrl: "/apartments",
        read: false,
        createdAt: now,
      });
    }

    // إرسال واتساب للضيف
    try {
      const guestPhone =
        booking.guestPhone ||
        (booking.userId ? (await ctx.db.get(booking.userId))?.phone : undefined);
      if (guestPhone) {
        const normPhone = normalizeSaudiPhone(guestPhone);
        const aptTitle = apartment?.titleAr || apartment?.title || "شقة في العلا";

        const guestCancelMsg =
          `نعتذر منك عزيزنا الضيف 🙏\n` +
          `نأسف لإبلاغك بتعذر قبول حجزك لشقة *${aptTitle}* نظراً لعدم توفرها في التواريخ المطلوبة.\n\n` +
          `نسعد بمساعدتك في اختيار شقة بديلة تناسبك في العلا عبر الرابط:\n` +
          `🔗 https://alulahome.com/apartments\n\n` +
          `شقق العلا تتمنى لك دائماً رحلة موفقة! 🌿`;

        await ctx.db.insert("whatsappQueue", {
          bookingId: booking._id,
          apartmentId: booking.apartmentId,
          ownerPhone: normPhone,
          message: guestCancelMsg,
          type: "booking_update",
          status: "pending",
          createdAt: now,
        });
      }
    } catch (e) {
      console.error("Failed to enqueue guest cancellation whatsapp message:", e);
    }

    return { success: true, message: "تم رفض الحجز وإشعار الضيف وإتاحة التواريخ" };
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

      const now = Date.now();
      const apartment = await ctx.db.get(booking.apartmentId);
      const invoiceNum = booking.invoiceNumber || `INV-${booking._id.slice(-6).toUpperCase()}`;
      const aptTitle = apartment?.titleAr || apartment?.title || "شقة في العلا";

      // 1. إشعار فوري لمالك الشقة (داخلي + واتساب)
      if (apartment?.ownerId) {
        await ctx.db.insert("notifications", {
          userId: apartment.ownerId,
          type: "booking_cancelled",
          title: "إلغاء حجز ⚠️",
          message: `تم إلغاء الحجز رقم (#${invoiceNum}) لشقة "${aptTitle}". تم إتاحة التواريخ للحجز مجدداً.`,
          relatedBookingId: args.bookingId,
          relatedApartmentId: booking.apartmentId,
          actionUrl: "/owner",
          read: false,
          createdAt: now,
        });

        // رسالة واتساب للمالك
        try {
          const ownerDoc = await ctx.db.get(apartment.ownerId);
          const ownerProf = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", apartment.ownerId!))
            .unique();
          const rawOwnerPhone = ownerProf?.phone || ownerDoc?.phone;
          if (rawOwnerPhone) {
            const normOwner = normalizeSaudiPhone(rawOwnerPhone);
            if (normOwner) {
              const ownerMsg =
                `⚠️ *تنبيه من منصة شقق العلا: تم إلغاء حجز*\n\n` +
                `🏠 *الوحدة:* ${aptTitle}\n` +
                `🧾 *رقم الفاتورة:* #${invoiceNum}\n` +
                `📅 *التواريخ:* من ${new Date(booking.checkIn).toLocaleDateString("ar-SA")} إلى ${new Date(booking.checkOut).toLocaleDateString("ar-SA")}\n\n` +
                `أصبحت تواريخ الشقة متاحة الآن لاستقبال حجوزات جديدة 🌴.`;

              await ctx.db.insert("whatsappQueue", {
                bookingId: args.bookingId,
                apartmentId: booking.apartmentId,
                ownerPhone: normOwner,
                message: ownerMsg,
                type: "booking_update",
                status: "pending",
                createdAt: now,
              });
            }
          }
        } catch {}
      }

      // 2. إشعار واتساب للضيف بنتيجة الإلغاء والاسترداد
      try {
        const guestPhone =
          booking.guestPhone ||
          (booking.userId ? (await ctx.db.get(booking.userId))?.phone : undefined);
        if (guestPhone) {
          const normGuest = normalizeSaudiPhone(guestPhone);
          if (normGuest) {
            const refundMsgText =
              refundPercentage === 100
                ? `تم استرداد كامل المبلغ (${booking.totalPrice.toLocaleString()} ر.س) لحسابك ✅`
                : refundPercentage === 50
                  ? `تم استرداد 50% من المبلغ (${refundAmount.toLocaleString()} ر.س) لحسابك ✅`
                  : `الإلغاء قبل أقل من 24 ساعة بدون استرداد وفق سياسة الإلغاء ℹ️`;

            const guestMsg =
              `🌿 *تأكيد إلغاء الحجز - شقق العلا*\n\n` +
              `تم إلغاء حجزك بنجاح لشقة: *${aptTitle}*\n` +
              `🧾 *رقم الفاتورة:* #${invoiceNum}\n` +
              `💳 *حالة الاسترداد:* ${refundMsgText}\n\n` +
              `يسعدنا دائماً خدمتك واستضافتك في رحلاتك القادمة إلى العلا ✨\n` +
              `🔗 https://alulahome.com/apartments`;

            await ctx.db.insert("whatsappQueue", {
              bookingId: args.bookingId,
              apartmentId: booking.apartmentId,
              ownerPhone: normGuest,
              message: guestMsg,
              type: "booking_update",
              status: "pending",
              createdAt: now,
            });
          }
        }
      } catch {}

      // 3. إشعار واتساب للأدمن (966506709265)
      try {
        const adminCancelMsg =
          `⚠️ *تم إلغاء حجز في المنصة*\n\n` +
          `🏠 *الشقة:* ${aptTitle}\n` +
          `🧾 *الفاتورة:* #${invoiceNum}\n` +
          `💰 *المبلغ:* ${booking.totalPrice.toLocaleString()} ر.س (استرداد: ${refundPercentage}%)\n` +
          `🔗 https://alulahome.com/admin`;

        await ctx.db.insert("whatsappQueue", {
          bookingId: args.bookingId,
          apartmentId: booking.apartmentId,
          ownerPhone: "966506709265",
          message: adminCancelMsg,
          type: "general",
          status: "pending",
          createdAt: now,
        });
      } catch {}

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
    const user = booking.userId ? await ctx.db.get(booking.userId) : null;
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

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      paymentStatus: "paid",
      paymentSessionId: args.sessionId,
      paidAt: now,
    });

    // تحديث حالة إكمال الدفع في التحليلات
    try {
      const analyticsRecords = await ctx.db
        .query("siteAnalytics")
        .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
        .collect();
      for (const rec of analyticsRecords) {
        await ctx.db.patch(rec._id, { completed: true });
      }
    } catch {}

    const updatedBooking = await ctx.db.get(args.bookingId);
    if (updatedBooking) {
      const apartment = await ctx.db.get(updatedBooking.apartmentId);
      const invoiceNum =
        updatedBooking.invoiceNumber ||
        `INV-${new Date().getFullYear()}-${updatedBooking._id.slice(-6).toUpperCase()}`;

      // إشعار فوري للضيف (إن كان مسجلاً)
      if (updatedBooking.userId) {
        await ctx.db.insert("notifications", {
          userId: updatedBooking.userId,
          type: "payment_confirmed",
          title: "🎉 تم تأكيد حجزك ودفع المبلغ بنجاح!",
          message: `تم سداد حجزك لشقة "${apartment?.titleAr || apartment?.title || "العلا"}" بنجاح (فاتورة #${invoiceNum}). يمكنك الآن التواصل مع المالك وعرض بيانات الوصول.`,
          relatedBookingId: args.bookingId,
          relatedApartmentId: updatedBooking.apartmentId,
          actionUrl: `/my-bookings?booking=${args.bookingId}`,
          read: false,
          createdAt: now,
        });
      }

      // إشعار فوري لمالك الشقة
      if (apartment?.ownerId) {
        await ctx.db.insert("notifications", {
          userId: apartment.ownerId,
          type: "booking_paid",
          title: "💰 حجز مؤكد ومسدد!",
          message: `تم استلام دفع حجز شقتك "${apartment.titleAr || apartment.title}" من الضيف ${updatedBooking.guestName || "ضيف"} بمبلغ ${(updatedBooking.totalPrice - updatedBooking.platformFee).toLocaleString()} ر.س (فاتورة #${invoiceNum}). يمكنك التواصل معه الآن.`,
          relatedBookingId: args.bookingId,
          relatedApartmentId: updatedBooking.apartmentId,
          actionUrl: "/owner",
          read: false,
          createdAt: now,
        });

        // إشعار واتساب تلقائي لمالك الشقة بتأكيد واستلام الدفع
        try {
          const ownerDoc = await ctx.db.get(apartment.ownerId);
          const ownerProf = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", apartment.ownerId!))
            .unique();
          const rawOwnerPhone = ownerProf?.phone || ownerDoc?.phone;
          if (rawOwnerPhone) {
            const normOwnerPhone = normalizeSaudiPhone(rawOwnerPhone);
            const netOwnerPayout = updatedBooking.totalPrice - updatedBooking.platformFee;
            const checkInDate = new Date(updatedBooking.checkIn).toLocaleDateString("ar-SA");
            const checkOutDate = new Date(updatedBooking.checkOut).toLocaleDateString("ar-SA");
            const ownerPaymentMsg =
              `💰 *تأكيد سداد حجز جديد - منصة شقق العلا*\n\n` +
              `تم استلام وسداد حجز شقتك: *${apartment.titleAr || apartment.title}*\n` +
              `👤 *النزيل:* ${updatedBooking.guestName || "ضيف"}\n` +
              `📅 *الفترة:* من ${checkInDate} إلى ${checkOutDate}\n` +
              `💵 *مستحقاتك الصافية:* ${netOwnerPayout.toLocaleString()} ر.س\n` +
              `🧾 *رقم الفاتورة:* #${invoiceNum}\n\n` +
              `يرجى تجهيز الوحدة لاستقبال الضيف في الموعد المحدد. نتمنى لك موسماً موفقاً! 🌴`;

            await ctx.db.insert("whatsappQueue", {
              ownerId: apartment.ownerId,
              bookingId: updatedBooking._id,
              apartmentId: updatedBooking.apartmentId,
              ownerPhone: normOwnerPhone,
              message: ownerPaymentMsg,
              type: "booking_update",
              status: "pending",
              createdAt: now,
            });
          }
        } catch (err) {
          console.error("Failed to enqueue owner WhatsApp payment update:", err);
        }
      }

      // إرسال الفاتورة تلقائياً عبر الواتساب للضيف عند إتمام الدفع
      try {
        const guestPhone =
          updatedBooking.guestPhone ||
          (updatedBooking.userId
            ? (await ctx.db.get(updatedBooking.userId))?.phone
            : undefined);
        if (guestPhone) {
          const normGuestPhone = normalizeSaudiPhone(guestPhone);
          const aptTitle = apartment?.titleAr || apartment?.title || "شقة في العلا";
          const checkInDate = new Date(updatedBooking.checkIn).toLocaleDateString("ar-SA");
          const checkOutDate = new Date(updatedBooking.checkOut).toLocaleDateString("ar-SA");
          const guestName = updatedBooking.guestName || "ضيف العلا";

          const invoiceMessage =
            `🧾 *فاتورة حجز مؤكد ومسدد - منصة شقق العلا*\n\n` +
            `*رقم الفاتورة:* #${invoiceNum}\n` +
            `*رقم الحجز:* #${updatedBooking._id.slice(-6).toUpperCase()}\n` +
            `🏠 *الوحدة:* ${aptTitle}\n` +
            `👤 *النزيل:* ${guestName}\n` +
            `📅 *الدخول:* ${checkInDate}\n` +
            `📅 *الخروج:* ${checkOutDate} (${updatedBooking.totalNights} ليالٍ)\n\n` +
            `💵 *قيمة الإقامة:* ${(updatedBooking.totalPrice - updatedBooking.platformFee).toLocaleString()} ر.س\n` +
            `📋 *رسوم المنصة والخدمة:* ${updatedBooking.platformFee.toLocaleString()} ر.س\n` +
            `💰 *المبلغ المسدد:* ${updatedBooking.totalPrice.toLocaleString()} ر.س ✅\n` +
            `💳 *حالة الدفع:* مسدد بالكامل بنجاح\n\n` +
            `للاطلاع على الفاتورة وتفاصيل الوصول:\n` +
            `🔗 https://alulahome.com/my-bookings?booking=${updatedBooking._id}\n\n` +
            `نتمنى لك إقامة ممتعة واستثنائية في العلا! 🌴✨`;

          await ctx.db.insert("whatsappQueue", {
            bookingId: updatedBooking._id,
            apartmentId: updatedBooking.apartmentId,
            ownerPhone: normGuestPhone,
            message: invoiceMessage,
            type: "invoice",
            status: "pending",
            createdAt: now,
          });
        }
      } catch (err) {
        console.error("Failed to enqueue guest WhatsApp invoice on markPaid:", err);
      }

      // إشعار فوري لجميع مديري المنصة (Admins) بسداد الحجز
      const admins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();
      for (const admin of admins) {
        if (admin._id !== apartment?.ownerId) {
          await ctx.db.insert("notifications", {
            userId: admin._id,
            type: "booking_paid",
            title: "💰 حجز مؤكد ومسدد في المنصة!",
            message: `تم سداد حجز شقة "${apartment?.titleAr || apartment?.title || "العلا"}" بنجاح بمبلغ ${updatedBooking.totalPrice.toLocaleString()} ر.س (فاتورة #${invoiceNum})`,
            relatedBookingId: args.bookingId,
            relatedApartmentId: updatedBooking.apartmentId,
            actionUrl: "/admin",
            read: false,
            createdAt: now,
          });
        }
      }
    }

    return updatedBooking;
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

    const now = Date.now();
    const apartment = await ctx.db.get(booking.apartmentId);
    const invoiceNum =
      booking.invoiceNumber ||
      `INV-${new Date().getFullYear()}-${booking._id.slice(-6).toUpperCase()}`;

    // إشعار فوري للمالك بإلغاء الحجز
    if (apartment?.ownerId) {
      await ctx.db.insert("notifications", {
        userId: apartment.ownerId,
        type: "booking_cancelled",
        title: "إلغاء حجز ⚠️",
        message: `تم إلغاء حجز شقتك "${apartment.titleAr || apartment.title}" (فاتورة #${invoiceNum}). أصبحت التواريخ متاحة مجدداً.`,
        relatedBookingId: args.bookingId,
        relatedApartmentId: booking.apartmentId,
        actionUrl: "/owner",
        read: false,
        createdAt: now,
      });
    }

    return await ctx.db.get(args.bookingId);
  },
});

