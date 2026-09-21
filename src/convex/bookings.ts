import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    apartmentId: v.optional(v.id("apartments")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let bookings = await ctx.db.query("bookings").collect();

    if (args.userId) {
      bookings = bookings.filter((b) => b.userId === args.userId);
    }
    if (args.apartmentId) {
      bookings = bookings.filter((b) => b.apartmentId === args.apartmentId);
    }
    if (args.status) {
      bookings = bookings.filter((b) => b.status === args.status);
    }

    // Enrich with apartment info
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const apartment = await ctx.db.get(booking.apartmentId);
        return { ...booking, apartment };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    const apartment = await ctx.db.get(booking.apartmentId);
    return { ...booking, apartment };
  },
});

export const checkAvailability = query({
  args: {
    apartmentId: v.id("apartments"),
    checkIn: v.number(),
    checkOut: v.number(),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const activeBookings = bookings.filter(
      (b) => b.status !== "cancelled",
    );

    // Check for overlapping dates
    const hasOverlap = activeBookings.some(
      (b) => args.checkIn < b.checkOut && args.checkOut > b.checkIn,
    );

    return {
      available: !hasOverlap,
      conflictingBookings: hasOverlap
        ? activeBookings.filter(
            (b) => args.checkIn < b.checkOut && args.checkOut > b.checkIn,
          )
        : [],
    };
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
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .first();
    if (!user) throw new Error("المستخدم غير موجود");

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) throw new Error("الشقة غير موجودة");
    if (!apartment.available) throw new Error("الشقة غير متاحة حالياً");

    // Check availability
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) =>
        q.eq("apartmentId", args.apartmentId),
      )
      .collect();

    const activeBookings = bookings.filter((b) => b.status !== "cancelled");
    const hasOverlap = activeBookings.some(
      (b) => args.checkIn < b.checkOut && args.checkOut > b.checkIn,
    );

    if (hasOverlap) {
      throw new Error("التواريخ غير متاحة — يوجد حجز في هذه الأيام");
    }

    // Calculate pricing
    const totalNights = Math.ceil(
      (args.checkOut - args.checkIn) / (1000 * 60 * 60 * 24),
    );
    if (totalNights < 1) throw new Error("يجب أن يكون الحجز ليلة على الأقل");

    const totalPrice = totalNights * apartment.price;
    const platformFee = Math.round(totalPrice * 0.1); // 10% commission

    const bookingId = await ctx.db.insert("bookings", {
      apartmentId: args.apartmentId,
      userId: userId as any,
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
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("الحجز غير موجود");

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
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("الحجز غير موجود");

    // Calculate cancellation fee based on time remaining
    const now = Date.now();
    const hoursUntilCheckin =
      (booking.checkIn - now) / (1000 * 60 * 60);
    let refundPercentage = 100;

    if (hoursUntilCheckin < 24) {
      refundPercentage = 0; // No refund within 24 hours
    } else if (hoursUntilCheckin < 72) {
      refundPercentage = 50; // 50% refund within 3 days
    }

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      paymentStatus: refundPercentage === 100 ? "refunded" : "paid",
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

// Owner: get bookings for their apartments
export const ownerBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];

    // Get owner's apartments
    const apartments = await ctx.db.query("apartments").collect();
    const myApartments = apartments.filter((a) => a.ownerId === userId);

    const bookings = await ctx.db.query("bookings").collect();
    const myBookings = bookings.filter((b) =>
      myApartments.some((a) => a._id === b.apartmentId),
    );

    const enriched = await Promise.all(
      myBookings.map(async (booking) => {
        const apartment = await ctx.db.get(booking.apartmentId);
        return { ...booking, apartment };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Stats for admin
export const adminStats = query({
  handler: async (ctx) => {
    const allBookings = await ctx.db.query("bookings").collect();
    const now = Date.now();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).getTime();

    const monthlyBookings = allBookings.filter(
      (b) => b.createdAt >= monthStart,
    );
    const activeBookings = allBookings.filter(
      (b) => b.status === "confirmed" && b.checkOut > now,
    );
    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const platformRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.platformFee, 0);
    const monthlyRevenue = monthlyBookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalPrice, 0);

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
