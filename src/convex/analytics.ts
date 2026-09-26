import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    return { recorded: true };
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
