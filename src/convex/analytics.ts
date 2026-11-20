import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { normalizeSaudiPhone } from "./whatsapp";

/**
 * تسجيل زيارة للموقع (تتبع حركة المرور والزوار الفريدين)
 */
export const recordVisit = mutation({
  args: {
    path: v.string(),
    visitorId: v.string(),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    // منع تكرار التسجيل لنفس الزائر في آخر 30 دقيقة لنفس المسار
    const recent = await ctx.db
      .query("siteVisits")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .filter((q) => q.gt(q.field("createdAt"), now - 30 * 60 * 1000))
      .first();

    if (recent && recent.path === args.path) {
      return { recorded: false };
    }

    await ctx.db.insert("siteVisits", {
      path: args.path,
      visitorId: args.visitorId,
      userId: userId ?? undefined,
      referrer: args.referrer,
      createdAt: now,
    });

    // تسجيل في جدول التحليلات الخفيف أيضاً
    await ctx.db.insert("siteAnalytics", {
      type: "page_view",
      path: args.path,
      visitorId: args.visitorId,
      userId: userId ?? undefined,
      createdAt: now,
    });

    return { recorded: true };
  },
});

/**
 * تسجيل بدء عملية الدفع والحجز (checkout_started)
 */
export const recordCheckoutStarted = mutation({
  args: {
    visitorId: v.string(),
    path: v.optional(v.string()),
    apartmentId: v.optional(v.id("apartments")),
    bookingId: v.optional(v.id("bookings")),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    let cleanPhone = args.phone ? normalizeSaudiPhone(args.phone) : undefined;
    if (!cleanPhone && userId) {
      const u = await ctx.db.get(userId);
      if (u?.phone) cleanPhone = normalizeSaudiPhone(u.phone);
    }

    return await ctx.db.insert("siteAnalytics", {
      type: "checkout_started",
      path: args.path || "/checkout",
      visitorId: args.visitorId,
      userId: userId ?? undefined,
      apartmentId: args.apartmentId,
      bookingId: args.bookingId,
      phone: cleanPhone,
      completed: false,
      reminderSent: false,
      createdAt: now,
    });
  },
});

/**
 * تحديث حالة الدفع إلى مكتمل (completed: true)
 */
export const markCheckoutCompleted = mutation({
  args: {
    bookingId: v.optional(v.id("bookings")),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.bookingId) {
      const records = await ctx.db
        .query("siteAnalytics")
        .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
        .collect();
      for (const rec of records) {
        await ctx.db.patch(rec._id, { completed: true });
      }
    }
    if (args.visitorId) {
      const records = await ctx.db
        .query("siteAnalytics")
        .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId!))
        .filter((q) => q.eq(q.field("type"), "checkout_started"))
        .collect();
      for (const rec of records) {
        await ctx.db.patch(rec._id, { completed: true });
      }
    }
  },
});

/**
 * إحصائيات الزوار حسب الفترات الزمنية
 */
export const getVisitorStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;
    const yearStart = now - 365 * 24 * 60 * 60 * 1000;

    const visits = await ctx.db.query("siteVisits").collect();

    const uniqueVisitors = (list: typeof visits) =>
      new Set(list.map((v) => v.visitorId)).size;

    const todayVisits = visits.filter((v) => v.createdAt >= todayStart);
    const weekVisits = visits.filter((v) => v.createdAt >= weekStart);
    const monthVisits = visits.filter((v) => v.createdAt >= monthStart);
    const yearVisits = visits.filter((v) => v.createdAt >= yearStart);

    return {
      today: {
        pageViews: todayVisits.length,
        uniqueVisitors: uniqueVisitors(todayVisits),
      },
      week: {
        pageViews: weekVisits.length,
        uniqueVisitors: uniqueVisitors(weekVisits),
      },
      month: {
        pageViews: monthVisits.length,
        uniqueVisitors: uniqueVisitors(monthVisits),
      },
      year: {
        pageViews: yearVisits.length,
        uniqueVisitors: uniqueVisitors(yearVisits),
      },
      all: {
        pageViews: visits.length,
        uniqueVisitors: uniqueVisitors(visits),
      },
    };
  },
});

/**
 * حساب بيانات التقرير اليومي المختصر لمنصة شقق العلا (توقيت مكة المكرمة UTC+3)
 */
export const getDailySummaryData = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // توقيت السعودية (UTC+3)
    const saudiOffset = 3 * 60 * 60 * 1000;
    const saudiNow = new Date(now + saudiOffset);
    const todayStart = new Date(
      Date.UTC(
        saudiNow.getUTCFullYear(),
        saudiNow.getUTCMonth(),
        saudiNow.getUTCDate()
      ) - saudiOffset
    ).getTime();

    // 1. الزوار الفريدين اليوم
    const todayVisits = await ctx.db
      .query("siteVisits")
      .withIndex("by_created", (q) => q.gte("createdAt", todayStart))
      .collect();
    const uniqueVisitors = new Set(todayVisits.map((v) => v.visitorId)).size;

    // 2. تتبع من وصل لصفحة الدفع
    const allCheckoutRecords = await ctx.db
      .query("siteAnalytics")
      .withIndex("by_type_created", (q) =>
        q.eq("type", "checkout_started").gte("createdAt", todayStart)
      )
      .collect();

    const completedCheckoutCount = allCheckoutRecords.filter((c) => c.completed).length;
    const abandonedCheckoutCount = Math.max(0, allCheckoutRecords.length - completedCheckoutCount);

    // 3. الحجوزات اليومية وحالاتها
    const allBookings = await ctx.db.query("bookings").collect();
    const todayBookings = allBookings.filter((b) => b.createdAt >= todayStart);

    const paidBookings = todayBookings.filter((b) => b.paymentStatus === "paid").length;
    const pendingBookings = todayBookings.filter((b) => b.status === "pending" && b.paymentStatus !== "paid").length;
    const cancelledBookings = todayBookings.filter((b) => b.status === "cancelled").length;

    // 4. إجمالي الإيرادات اليوم (من الحجوزات المدفوعة اليوم)
    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid" && (b.paidAt ? b.paidAt >= todayStart : b.createdAt >= todayStart))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // 5. البلاغات الجديدة اليوم
    const allReports = await ctx.db.query("reports").collect();
    const newReports = allReports.filter((r) => r.createdAt >= todayStart).length;

    return {
      todayDate: saudiNow.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh" }),
      uniqueVisitors,
      totalCheckoutStarted: allCheckoutRecords.length,
      abandonedCheckoutCount,
      totalBookings: todayBookings.length,
      paidBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      newReports,
    };
  },
});

/**
 * نص التقرير اليومي المختصر المنسق للواتساب (لاستخدام Cron وبوت الواتساب ChatOps)
 */
export const getDailyAdminReportText = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const saudiOffset = 3 * 60 * 60 * 1000;
    const saudiNow = new Date(now + saudiOffset);
    const todayStart = new Date(
      Date.UTC(
        saudiNow.getUTCFullYear(),
        saudiNow.getUTCMonth(),
        saudiNow.getUTCDate()
      ) - saudiOffset
    ).getTime();

    const todayVisits = await ctx.db
      .query("siteVisits")
      .withIndex("by_created", (q) => q.gte("createdAt", todayStart))
      .collect();
    const uniqueVisitors = new Set(todayVisits.map((v) => v.visitorId)).size;

    const allCheckoutRecords = await ctx.db
      .query("siteAnalytics")
      .withIndex("by_type_created", (q) =>
        q.eq("type", "checkout_started").gte("createdAt", todayStart)
      )
      .collect();

    const completedCheckoutCount = allCheckoutRecords.filter((c) => c.completed).length;
    const abandonedCheckoutCount = Math.max(0, allCheckoutRecords.length - completedCheckoutCount);

    const allBookings = await ctx.db.query("bookings").collect();
    const todayBookings = allBookings.filter((b) => b.createdAt >= todayStart);

    const paidBookings = todayBookings.filter((b) => b.paymentStatus === "paid").length;
    const pendingBookings = todayBookings.filter((b) => b.status === "pending" && b.paymentStatus !== "paid").length;
    const cancelledBookings = todayBookings.filter((b) => b.status === "cancelled").length;

    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid" && (b.paidAt ? b.paidAt >= todayStart : b.createdAt >= todayStart))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const allReports = await ctx.db.query("reports").collect();
    const newReports = allReports.filter((r) => r.createdAt >= todayStart).length;
    const dateStr = saudiNow.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh" });

    return (
      `📊 *تقرير شقق العلا اليومي* 🌴\n` +
      `📅 *التاريخ:* ${dateStr}\n\n` +
      `👥 *الزوار اليوم:* ${uniqueVisitors} زائر فريد\n` +
      `🛒 *بدء الدفع ولم يكتمل:* ${abandonedCheckoutCount}\n\n` +
      `📦 *إجمالي الحجوزات اليوم:* ${todayBookings.length}\n` +
      `  - مؤكدة ومسددة: ${paidBookings} ✅\n` +
      `  - بانتظار الدفع: ${pendingBookings} ⏳\n` +
      `  - ملغية: ${cancelledBookings} ❌\n\n` +
      `💰 *إجمالي الإيرادات اليوم:* ${totalRevenue.toLocaleString()} ر.س\n` +
      `🚨 *البلاغات الجديدة:* ${newReports}\n\n` +
      `نظام التشغيل والمراقبة يعمل بكفاءة 100% ✨`
    );
  },
});

/**
 * نص الإحصائيات الشهرية وإجمالي الإيرادات (للإدارة عبر الواتساب)
 */
export const getMonthlyAdminReportText = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const saudiOffset = 3 * 60 * 60 * 1000;
    const saudiNow = new Date(now + saudiOffset);
    const monthStart = new Date(
      Date.UTC(
        saudiNow.getUTCFullYear(),
        saudiNow.getUTCMonth(),
        1
      ) - saudiOffset
    ).getTime();

    // 1. زيارات الشهر
    const monthlyVisits = await ctx.db
      .query("siteVisits")
      .withIndex("by_created", (q) => q.gte("createdAt", monthStart))
      .collect();
    const uniqueVisitors = new Set(monthlyVisits.map((v) => v.visitorId)).size;

    // 2. حجوزات الشهر
    const allBookings = await ctx.db.query("bookings").collect();
    const monthlyBookings = allBookings.filter((b) => b.createdAt >= monthStart);

    const paidBookings = monthlyBookings.filter((b) => b.paymentStatus === "paid").length;
    const pendingBookings = monthlyBookings.filter(
      (b) => b.status === "pending" && b.paymentStatus !== "paid"
    ).length;
    const cancelledBookings = monthlyBookings.filter((b) => b.status === "cancelled").length;

    // 3. إجمالي إيرادات الشهر
    const totalMonthlyRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid" && (b.paidAt ? b.paidAt >= monthStart : b.createdAt >= monthStart))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const monthName = saudiNow.toLocaleDateString("ar-SA", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Riyadh",
    });

    return (
      `📈 *إحصائيات وإيرادات شهر (${monthName})* 🌴\n\n` +
      `👥 *الزوار الفريدون خلال الشهر:* ${uniqueVisitors.toLocaleString()} زائر\n` +
      `📄 *إجمالي مشاهدات الصفحات:* ${monthlyVisits.length.toLocaleString()}\n\n` +
      `📦 *إجمالي طلبات الحجز:* ${monthlyBookings.length}\n` +
      `  - حجوزات مؤكدة ومدفوعة: ${paidBookings} ✅\n` +
      `  - حجوزات قيد الانتظار: ${pendingBookings} ⏳\n` +
      `  - حجوزات ملغية: ${cancelledBookings} ❌\n\n` +
      `💰 *إجمالي الإيرادات الشهرية المحققة:* ${totalMonthlyRevenue.toLocaleString()} ر.س\n\n` +
      `منصة شقق العلا تنمو بنجاح وتستقبل ضيوفها دائماً! ✨`
    );
  },
});
