/**
 * نظام البلاغات:
 * - المستخدم يبلّغ عن شقة أو تقييم أو مستخدم
 * - الأدمن يعالج البلاغات (حل / تجاهل)
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ERROR_MESSAGES, ValidationError } from "./lib/errors";
import { logActivity } from "./lib/activityLog";

const REPORT_COOLDOWN_MS = 60 * 60 * 1000; // بلاغ واحد كل ساعة لنفس الهدف

async function requireUser(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
  const user = await ctx.db.get(userId);
  if (!user) throw new ValidationError("المستخدم غير موجود");
  if (user.isDisabled) throw new ValidationError("حسابك معطّل — تواصل مع الدعم");
  return user;
}

/** كل البلاغات — للأدمن (الأحدث أولاً) */
export const adminAllReports = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);

    const all = await ctx.db.query("reports").collect();
    const sorted = all.sort((a, b) => b.createdAt - a.createdAt);

    // إثراء بيانات المُبلّغ
    return Promise.all(
      sorted.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        return {
          ...report,
          reporterName: reporter?.name ?? reporter?.email ?? "مستخدم",
        };
      }),
    );
  },
});

/** إنشاء بلاغ */
export const create = mutation({
  args: {
    targetType: v.union(v.literal("apartment"), v.literal("review"), v.literal("user")),
    targetId: v.string(),
    reason: v.union(
      v.literal("inaccurate"),
      v.literal("inappropriate_images"),
      v.literal("misleading"),
      v.literal("scam"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.details !== undefined && args.details.length > 1000) {
      throw new ValidationError("التفاصيل طويلة جداً (الحد 1000 حرف)");
    }

    // منع السبام: بلاغ واحد لنفس الهدف في الساعة
    const recent = await ctx.db
      .query("reports")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .collect();
    if (recent.some((r) => r.reporterId === user._id && Date.now() - r.createdAt < REPORT_COOLDOWN_MS)) {
      throw new ValidationError("أرسلت بلاغاً عن هذا المحتوى مؤخراً — سيُراجع قريباً");
    }

    // التحقق من وجود الهدف
    if (args.targetType === "apartment") {
      const target = await ctx.db.get(args.targetId as never);
      if (!target) throw new ValidationError("الشقة المُبلّغ عنها غير موجودة");
    }

    const reportId = await ctx.db.insert("reports", {
      reporterId: user._id,
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason,
      details: args.details?.trim() || undefined,
      status: "pending",
      createdAt: Date.now(),
    });

    return { reportId, message: "تم إرسال البلاغ — سيُراجع من الإدارة" };
  },
});

/** معالجة بلاغ — للأدمن */
export const adminResolveReport = mutation({
  args: {
    reportId: v.id("reports"),
    resolved: v.boolean(), // true = تم الحل، false = تجاهل
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new ValidationError("البلاغ غير موجود");
    if (report.status !== "pending") {
      throw new ValidationError("تمت معالجة هذا البلاغ مسبقاً");
    }

    await ctx.db.patch(args.reportId, {
      status: args.resolved ? "resolved" : "dismissed",
      resolutionNote: args.note?.trim() || undefined,
      resolvedBy: admin._id,
      resolvedAt: Date.now(),
    });

    await logActivity(ctx, {
      actorId: admin._id,
      action: "apartment_updated",
      resourceType: "report",
      resourceId: args.reportId,
      details: args.resolved ? "معالجة بلاغ" : "تجاهل بلاغ",
    });

    return args.resolved ? "تمت معالجة البلاغ" : "تم تجاهل البلاغ";
  },
});

/** عدد البلاغات المعلّقة — للأدمن (لشارة في اللوحة) */
export const adminPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") return 0;
    const all = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return all.length;
  },
});
