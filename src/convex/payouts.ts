/**
 * نظام مستحقات المالكين
 * - المالك يضيف/يحدّث بيانات حسابه البنكي (IBAN)
 * - المالك يرى رصيده: إجمالي المحصّل، المستحق، المحوّل، المعلّق
 * - الأدمن يسجل تحويلات (يدوياً حتى ربط مزود دفع لاحقاً)
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ERROR_MESSAGES, ValidationError } from "./lib/errors";
import { logActivity } from "./lib/activityLog";

/** فحص صلاحيات الأدمن — يعمل في query وmutation */
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
  }
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") {
    throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);
  }
  return user;
}

const IBAN_REGEX = /^SA\d{22}$/; // IBAN سعودي: SA + 22 رقماً

/**
 * حفظ بيانات حساب المالك البنكي.
 */
export const saveBankAccount = mutation({
  args: {
    iban: v.string(),
    accountHolderName: v.string(),
    bankName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ValidationError("المستخدم غير موجود");
    }
    if (user.role !== "owner" && user.role !== "admin") {
      throw new ValidationError("بيانات التحويل خاصة بمالكي العقارات");
    }

    const iban = args.iban.replace(/\s+/g, "").toUpperCase();
    if (!IBAN_REGEX.test(iban)) {
      throw new ValidationError("IBAN سعودي غير صالح — يجب أن يبدأ بـ SA ويتبعه 22 رقماً");
    }
    if (!args.accountHolderName.trim()) {
      throw new ValidationError("اكتب اسم صاحب الحساب كما في البنك");
    }

    const existing = await ctx.db
      .query("ownerPayoutAccounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        iban,
        accountHolderName: args.accountHolderName.trim(),
        bankName: args.bankName?.trim(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("ownerPayoutAccounts", {
        ownerId: userId,
        iban,
        accountHolderName: args.accountHolderName.trim(),
        bankName: args.bankName?.trim(),
        updatedAt: Date.now(),
      });
    }

    await logActivity(ctx, {
      actorId: userId,
      action: "owner_bank_details_updated",
      resourceType: "user",
      resourceId: userId,
    });

    return "تم حفظ بيانات الحساب البنكي";
  },
});

/**
 * بيانات حساب المالك البنكي (للمالك نفسه).
 */
export const myBankAccount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const account = await ctx.db
      .query("ownerPayoutAccounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .unique();

    return account;
  },
});

/**
 * ملخص مالي شامل للمالك: الإيرادات، العمولة، المستحق، المحوّل.
 */
export const myEarnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // شقق المالك
    const myApartments = await ctx.db
      .query("apartments")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const apartmentIds = new Set(myApartments.map((a) => a._id));

    // حجوزات مدفوعة على شقته
    const allBookings = await ctx.db.query("bookings").collect();
    const paidBookings = allBookings.filter(
      (b) =>
        b.paymentStatus === "paid" &&
        b.status !== "cancelled" &&
        apartmentIds.has(b.apartmentId),
    );

    const grossRevenue = paidBookings.reduce((s, b) => s + b.totalPrice, 0);
    const platformFees = paidBookings.reduce((s, b) => s + b.platformFee, 0);
    const netEarnings = grossRevenue - platformFees;

    // تحويلات المالك
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const transferred = payouts
      .filter((p) => p.status === "completed")
      .reduce((s, p) => s + p.amount, 0);
    const pendingPayouts = payouts
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.amount, 0);

    const available = Math.max(0, netEarnings - transferred - pendingPayouts);

    return {
      grossRevenue,
      platformFees,
      netEarnings,
      transferred,
      pendingPayouts,
      available,
      paidBookingsCount: paidBookings.length,
      payoutsCount: payouts.length,
    };
  },
});

/**
 * سجل تحويلات المالك.
 */
export const myPayouts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("payouts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .collect();
  },
});

// ━━━ دوال الأدمن ━━━

/**
 * كل حسابات المالكين (للأدمن).
 */
export const adminAllAccounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("ownerPayoutAccounts").collect();
  },
});

/**
 * كل التحويلات (للأدمن).
 */
export const adminAllPayouts = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"))) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.status) {
      return await ctx.db
        .query("payouts")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("payouts").order("desc").collect();
  },
});

/**
 * تسجيل تحويل مستحقات لمالك (من الأدمن).
 * يتحقق أن المبلغ لا يتجاوز الرصيد المتاح.
 */
export const adminRecordPayout = mutation({
  args: {
    ownerId: v.id("users"),
    amount: v.number(),
    method: v.union(v.literal("manual_transfer"), v.literal("bank")),
    reference: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new ValidationError("المبلغ غير صالح");
    }

    const owner = await ctx.db.get(args.ownerId);
    if (!owner) {
      throw new ValidationError("المالك غير موجود");
    }

    // التحقق من الرصيد المتاح
    const myApartments = await ctx.db
      .query("apartments")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    const apartmentIds = new Set(myApartments.map((a) => a._id));

    const allBookings = await ctx.db.query("bookings").collect();
    const paidBookings = allBookings.filter(
      (b) =>
        b.paymentStatus === "paid" &&
        b.status !== "cancelled" &&
        apartmentIds.has(b.apartmentId),
    );

    const netEarnings =
      paidBookings.reduce((s, b) => s + b.totalPrice, 0) -
      paidBookings.reduce((s, b) => s + b.platformFee, 0);

    const existingPayouts = await ctx.db
      .query("payouts")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    const alreadyCommitted = existingPayouts
      .filter((p) => p.status !== "failed")
      .reduce((s, p) => s + p.amount, 0);

    const available = netEarnings - alreadyCommitted;
    if (args.amount > available + 0.01) {
      throw new ValidationError(
        `المبلغ يتجاوز الرصيد المتاح (${Math.max(0, Math.floor(available))} ر.س)`,
      );
    }

    const account = await ctx.db
      .query("ownerPayoutAccounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .unique();
    if (!account) {
      throw new ValidationError("المالك لم يضف بياناته البنكية بعد — لا يمكن التحويل");
    }

    const payoutId = await ctx.db.insert("payouts", {
      ownerId: args.ownerId,
      amount: Math.round(args.amount * 100) / 100,
      method: args.method,
      reference: args.reference?.trim() || undefined,
      note: args.note?.trim() || undefined,
      status: "completed", // التحويل اليدوي يُسجّل منفذاً
      recordedBy: admin._id,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    await logActivity(ctx, {
      actorId: admin._id,
      action: "payout_recorded",
      resourceType: "payout",
      resourceId: payoutId,
      details: `تحويل ${args.amount} ر.س إلى المالك ${owner.name ?? args.ownerId}`,
    });

    // إشعار المالك
    await ctx.db.insert("notifications", {
      userId: args.ownerId,
      type: "payout_transferred",
      title: "💸 تم تحويل مستحقاتك",
      message: `تم تحويل مبلغ ${args.amount} ر.س إلى حسابك${args.reference ? ` — مرجع: ${args.reference}` : ""}`,
      read: false,
      createdAt: Date.now(),
    });

    return { payoutId, message: "تم تسجيل التحويل" };
  },
});
