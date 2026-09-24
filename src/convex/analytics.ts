/**
 * نظام التقارير والإحصائيات المتقدمة
 * إحصائيات شاملة للمالكين والإدارة
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * إحصائيات المالك (Dashboard)
 */
export const getOwnerStats = query({
  args: {
    ownerId: v.id("users"),
    period: v.optional(v.string()), // "week", "month", "year"
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const now = Date.now();
    let startDate = now;

    if (period === "week") {
      startDate = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === "month") {
      startDate = now - 30 * 24 * 60 * 60 * 1000;
    } else if (period === "year") {
      startDate = now - 365 * 24 * 60 * 60 * 1000;
    }

    // جلب الشقق الخاصة بالمالك
    const apartments = await ctx.db
      .query("apartments")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    let totalBookings = 0;
    let totalRevenue = 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let averageRating = 0;
    let totalReviews = 0;

    // حساب الإحصائيات لكل شقة
    for (const apartment of apartments) {
      // جلب الحجوزات
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_apartment", (q) => q.eq("apartmentId", apartment._id))
        .collect();

      // فلترة حسب الفترة الزمنية
      const periodBookings = bookings.filter(
        (b) => b.createdAt >= startDate && b.createdAt <= now
      );

      totalBookings += periodBookings.length;
      confirmedBookings += periodBookings.filter(
        (b) => b.status === "confirmed"
      ).length;
      cancelledBookings += periodBookings.filter(
        (b) => b.status === "cancelled"
      ).length;

      // حساب الإيرادات
      for (const booking of periodBookings) {
        if (booking.paymentStatus === "paid") {
          totalRevenue += booking.totalPrice;
        }
      }

      // جلب التقييمات
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_apartment", (q) => q.eq("apartmentId", apartment._id))
        .collect();

      if (reviews.length > 0) {
        totalReviews += reviews.length;
        const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        averageRating = sumRating / reviews.length;
      }
    }

    return {
      totalApartments: apartments.length,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      cancellationRate:
        totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      totalRevenue,
      averageBookingValue:
        totalBookings > 0 ? totalRevenue / totalBookings : 0,
      averageRating: averageRating > 0 ? averageRating.toFixed(1) : "لا توجد تقييمات",
      totalReviews,
      period,
    };
  },
});

/**
 * إحصائيات المنصة (Admin Dashboard)
 */
export const getPlatformStats = query({
  handler: async (ctx) => {
    // جلب جميع المستخدمين
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const owners = allUsers.filter((u) => u.role === "owner").length;
    const guests = allUsers.filter((u) => u.role === "user").length;

    // جلب جميع الشقق
    const allApartments = await ctx.db.query("apartments").collect();
    const totalApartments = allApartments.length;
    const activeListings = allApartments.filter((a) => a.available).length;

    // جلب جميع الحجوزات
    const allBookings = await ctx.db.query("bookings").collect();
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(
      (b) => b.status === "confirmed"
    ).length;
    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // حساب معدل النمو (آخر 30 يوم مقابل 30 يوم قبله)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const lastMonthBookings = allBookings.filter(
      (b) => b.createdAt >= thirtyDaysAgo && b.createdAt <= now
    ).length;

    const previousMonthBookings = allBookings.filter(
      (b) => b.createdAt >= sixtyDaysAgo && b.createdAt < thirtyDaysAgo
    ).length;

    const growthRate =
      previousMonthBookings > 0
        ? ((lastMonthBookings - previousMonthBookings) / previousMonthBookings) *
          100
        : 0;

    return {
      users: {
        total: totalUsers,
        owners,
        guests,
      },
      apartments: {
        total: totalApartments,
        active: activeListings,
        inactive: totalApartments - activeListings,
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: allBookings.filter((b) => b.status === "pending").length,
        cancelled: allBookings.filter((b) => b.status === "cancelled").length,
      },
      revenue: {
        total: totalRevenue,
        lastMonth: allBookings
          .filter(
            (b) =>
              b.paymentStatus === "paid" &&
              b.createdAt >= thirtyDaysAgo &&
              b.createdAt <= now
          )
          .reduce((sum, b) => sum + b.totalPrice, 0),
      },
      growth: {
        rate: growthRate.toFixed(2) + "%",
        lastMonth: lastMonthBookings,
        previousMonth: previousMonthBookings,
      },
    };
  },
});

/**
 * إحصائيات الشقة
 */
export const getApartmentStats = query({
  args: {
    apartmentId: v.id("apartments"),
  },
  handler: async (ctx, args) => {
    const apartment = await ctx.db.get(args.apartmentId);

    if (!apartment) {
      throw new Error("الشقة غير موجودة");
    }

    // جلب الحجوزات
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const confirmedBookings = bookings.filter(
      (b) => b.status === "confirmed"
    );
    const totalRevenue = confirmedBookings.reduce(
      (sum, b) => sum + b.totalPrice,
      0
    );

    // حساب معدل الاشغال
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const nextYear = todayMs + 365 * 24 * 60 * 60 * 1000;

    const occupiedDays = confirmedBookings
      .filter((b) => b.checkOut > todayMs && b.checkIn < nextYear)
      .reduce((sum, b) => {
        const start = Math.max(b.checkIn, todayMs);
        const end = Math.min(b.checkOut, nextYear);
        return sum + (end - start) / (24 * 60 * 60 * 1000);
      }, 0);

    const occupancyRate = (occupiedDays / 365) * 100;

    // جلب التقييمات
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : "لا توجد تقييمات";

    return {
      apartment: {
        id: apartment._id,
        title: apartment.title,
        location: apartment.location,
      },
      bookings: {
        total: bookings.length,
        confirmed: confirmedBookings.length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
        pending: bookings.filter((b) => b.status === "pending").length,
      },
      revenue: {
        total: totalRevenue,
        average: confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0,
      },
      occupancy: {
        rate: occupancyRate.toFixed(1) + "%",
        occupiedDays: Math.round(occupiedDays),
      },
      reviews: {
        total: reviews.length,
        average: averageRating,
      },
    };
  },
});

/**
 * تقرير البحث والفلترة
 */
export const getSearchStats = query({
  handler: async (ctx) => {
    // سيتم تتبع عمليات البحث الشهيرة
    // هذا يتطلب جدول searchLogs في قاعدة البيانات
    return {
      message: "تقرير البحث متوفر قريباً",
    };
  },
});
