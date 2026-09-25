/**
 * التحقق من هوية المالك:
 * - المالك يرفع صورة الهوية/السجل التجاري مع نوع الملكية
 * - الأدمن يقبل أو يرفض مع سبب
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ERROR_MESSAGES, ValidationError } from "./lib/errors";
import { logActivity } from "./lib/activityLog";

async function requireUser(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
  const user = await ctx.db.get(userId);
  if (!user) throw new ValidationError("المستخدم غير موجود");
  return user;
}

async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);
  return user;
}

/** حالة طلب التحقق للمستخدم الحالي */
export const myVerification = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const requests = await ctx.db
      .query("identityVerifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    // آخر طلب
    requests.sort((a, b) => b.createdAt - a.createdAt);
    const latest = requests[0] ?? null;
    return {
      status: latest?.status ?? "none",
      rejectionReason: latest?.rejectionReason,
      createdAt: latest?.createdAt,
      ownerType: latest?.ownerType,
      documentType: latest?.documentType,
    };
  },
});

/** كل طلبات التحقق — للأدمن */
export const adminAllVerifications = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("identityVerifications").collect();
    return all.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** رفع طلب تحقق هوية (من المالك) */
export const submitVerification = mutation({
  args: {
    ownerType: v.union(v.literal("individual"), v.literal("company"), v.literal("property_manager")),
    fullName: v.string(),
    documentType: v.union(v.literal("national_id"), v.literal("commercial_register")),
    documentStorageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "owner" && user.role !== "admin") {
      throw new ValidationError("التحقق خاص بمالكي العقارات");
    }

    if (!args.fullName.trim()) {
      throw new ValidationError("اكتب الاسم الرسمي كما في الوثيقة");
    }
    if (args.documentStorageId.length < 10) {
      throw new ValidationError("معرّف الوثيقة غير صالح — ارفع الصورة أولاً");
    }

    // طلب قيد المراجعة موجود؟ لا تكرار
    const existing = await ctx.db
      .query("identityVerifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (existing.some((r) => r.status === "pending")) {
      throw new ValidationError("لديك طلب قيد المراجعة بالفعل — انتظر قرار الإدارة");
    }

    const id = await ctx.db.insert("identityVerifications", {
      userId: user._id,
      ownerType: args.ownerType,
      fullName: args.fullName.trim(),
      documentType: args.documentType,
      documentStorageId: args.documentStorageId,
      status: "pending",
      createdAt: Date.now(),
    });

    await logActivity(ctx, {
      actorId: user._id,
      action: "apartment_updated",
      resourceType: "identityVerification",
      resourceId: id,
      details: `طلب تحقق هوية (${args.ownerType})`,
    });

    return "تم إرسال طلب التحقق — ستُبلغ بالقرار عبر الإشعارات";
  },
});

/** قبول/رفض التحقق — للأدمن */
export const adminReviewVerification = mutation({
  args: {
    verificationId: v.id("identityVerifications"),
    approved: v.boolean(),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const request = await ctx.db.get(args.verificationId);
    if (!request) throw new ValidationError("الطلب غير موجود");
    if (request.status !== "pending") {
      throw new ValidationError("تمت معالجة هذا الطلب مسبقاً");
    }
    if (!args.approved && !args.rejectionReason?.trim()) {
      throw new ValidationError("اكتب سبب الرفض");
    }

    await ctx.db.patch(args.verificationId, {
      status: args.approved ? "approved" : "rejected",
      rejectionReason: args.approved ? undefined : args.rejectionReason!.trim(),
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    // تحديث userProfiles.identityVerified
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", request.userId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, {
        identityVerified: args.approved,
        verifiedAt: args.approved ? Date.now() : undefined,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: request.userId,
        identityVerified: args.approved,
        verifiedAt: args.approved ? Date.now() : undefined,
      });
    }

    await ctx.db.insert("notifications", {
      userId: request.userId,
      type: "identity_verification",
      title: args.approved ? "✅ تم توثيق هويتك" : "❌ لم يُقبل طلب التحقق",
      message: args.approved
        ? "تمت الموافقة على توثيق هويتك — أصبح حسابك موثوقاً كمالك عقار"
        : `تم رفض طلب التحقق. السبب: ${args.rejectionReason}`,
      actionUrl: "/owner/profile",
      read: false,
      createdAt: Date.now(),
    });

    await logActivity(ctx, {
      actorId: admin._id,
      action: args.approved ? "apartment_approved" : "apartment_rejected",
      resourceType: "identityVerification",
      resourceId: args.verificationId,
      details: args.approved ? "قبول تحقق هوية" : `رفض تحقق هوية: ${args.rejectionReason}`,
    });

    return args.approved ? "تم قبول التحقق" : "تم رفض الطلب";
  },
});
