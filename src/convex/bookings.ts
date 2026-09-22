import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  type DatabaseCtx,
  requireAnyRole,
  requireBookingAccess,
  requireRole,
  requireUser,
} from "./lib/authorization";

const DAY_MS = 1000 * 60 * 60 * 24;
const bookingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("completed"),
);

async function enrichBooking(ctx: DatabaseCtx, booking: Doc<"bookings">) {
  const apartment = await ctx.db.get(booking.apartmentId);
  return { ...booking, apartment };
}

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
    if (!apartment || apartment.available === false) {
      return { available: false };
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const hasOverlap = bookings.some(
      (booking) =>
        booking.status !== "cancelled" &&
        args.checkIn < booking.checkOut &&
        args.checkOut > booking.checkIn,
    );

    return { available: !hasOverlap };
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
    const user = await requireUser(ctx);
    const apartment = await ctx.db.get(args.apartmentId);

    if (!apartment) {
      throw new Error("الشقة غير موجودة");
    }
    if (apartment.available === false) {
      throw new Error("الشقة غير متاحة حالياً");
    }
    if (!Number.isInteger(args.guests) || args.guests < 1) {
      throw new Error("عدد الضيوف غير صالح");
    }
    if (args.guests > apartment.maxGuests) {
      throw new Error("عدد الضيوف يتجاوز الحد المسموح");
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (
      !Number.isFinite(args.checkIn) ||
      !Number.isFinite(args.checkOut) ||
      args.checkIn < startOfToday.getTime() ||
      args.checkOut <= args.checkIn
    ) {
      throw new Error("تواريخ الحجز غير صالحة");
    }

    const totalNights = Math.ceil((args.checkOut - args.checkIn) / DAY_MS);
    if (totalNights < 1) {
      throw new Error("يجب أن يكون الحجز ليلة على الأقل");
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();
    const hasOverlap = bookings.some(
      (booking) =>
        booking.status !== "cancelled" &&
        args.checkIn < booking.checkOut &&
        args.checkOut > booking.checkIn,
    );

    if (hasOverlap) {
      throw new Error("التواريخ غير متاحة — يوجد حجز في هذه الأيام");
    }

    const totalPrice = totalNights * apartment.price;
    const platformFee = Math.round(totalPrice * 0.1);

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
  },
});

export const confirm = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const booking = await ctx.db.get(args.bookingId);

    if (!booking) {
      throw new Error("الحجز غير موجود");
    }
    if (booking.status !== "pending") {
      throw new Error("لا يمكن تأكيد هذا الحجز");
    }

    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      paymentStatus: "paid",
    });

    return "تم تأكيد الحجز";
  },
});

export const cancel = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const { user, booking } = await requireBookingAccess(ctx, args.bookingId);
    if (user.role !== "admin" && booking.userId !== user._id) {
      throw new Error("لا يمكنك إلغاء هذا الحجز");
    }
    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("لا يمكن إلغاء هذا الحجز");
    }

    const hoursUntilCheckin = (booking.checkIn - Date.now()) / (1000 * 60 * 60);
    const refundPercentage =
      hoursUntilCheckin < 24 ? 0 : hoursUntilCheckin < 72 ? 50 : 100;
    const paymentStatus =
      booking.paymentStatus !== "paid"
        ? "unpaid"
        : refundPercentage === 100
          ? "refunded"
          : "paid";

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      paymentStatus,
    });

    return {
      cancelled: true,
      refundPercentage,
      message:
        refundPercentage === 100
          ? "تم الإلغاء واسترداد المبلغ بالكامل"
          : refundPercentage === 50
            ? "تم الإلغاء واسترداد 50% من المبلغ"
            : "تم الإلغاء بدون استرداد (أقل من 24 ساعة)",
    };
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
    return { booking, apartment };
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
    if (booking.status !== "pending" || booking.paymentStatus !== "unpaid") {
      throw new Error("لا يمكن بدء الدفع لهذا الحجز");
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
    if (
      booking.status !== "pending" ||
      booking.paymentSessionId !== args.sessionId
    ) {
      throw new Error("جلسة الدفع غير صالحة لهذا الحجز");
    }

    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      paymentStatus: "paid",
    });

    return await ctx.db.get(args.bookingId);
  },
});
