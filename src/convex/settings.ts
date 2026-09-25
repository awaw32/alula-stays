/**
 * إعدادات المنصة — التواصل ومزودات الخدمات
 * يُدار من تبويب الإعدادات في لوحة الأدمن (سجل وحيد key = "general")
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ERROR_MESSAGES, ValidationError } from "./lib/errors";
import { logActivity } from "./lib/activityLog";

export const SETTINGS_KEY = "general";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{8,20}$/;

/** قراءة الإعدادات — عامة (تحتاجها الصفحة الرئيسية والتذييل) */
export const get = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const settings = await ctx.db
      .query("siteSettings")
      .filter((q) => q.eq(q.field("key"), SETTINGS_KEY))
      .unique();
    return settings ?? null;
  },
});

/** تحديث الإعدادات — للأدمن فقط */
export const update = mutation({
  args: {
    brandName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    paymentProvider: v.optional(v.string()),
    emailProvider: v.optional(v.string()),
    mapsProvider: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const admin = await (async () => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
      const user = await ctx.db.get(userId);
      if (user?.role !== "admin") throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);
      return user;
    })();

    // تحقق من الصيغ
    if (args.contactEmail && !EMAIL_REGEX.test(args.contactEmail)) {
      throw new ValidationError("صيغة البريد الإلكتروني غير صحيحة");
    }
    if (args.contactPhone && !PHONE_REGEX.test(args.contactPhone)) {
      throw new ValidationError("صيغة رقم الجوال غير صحيحة");
    }
    if (args.whatsapp && !PHONE_REGEX.test(args.whatsapp)) {
      throw new ValidationError("صيغة رقم واتساب غير صحيحة");
    }

    const allowedProviders: Record<string, string[]> = {
      paymentProvider: ["", "moyasar", "tap", "stripe"],
      emailProvider: ["", "sendgrid", "mailgun", "none"],
      mapsProvider: ["", "openstreetmap", "google"],
    };
    for (const [field, values] of Object.entries(allowedProviders)) {
      const value = args[field as keyof typeof args] as string | undefined;
      if (value !== undefined && !values.includes(value)) {
        throw new ValidationError(`قيمة غير صالحة لـ ${field}`);
      }
    }

    const existing = await ctx.db
      .query("siteSettings")
      .filter((q) => q.eq(q.field("key"), SETTINGS_KEY))
      .unique();

    const updates: Record<string, string | number | undefined> = { updatedAt: Date.now(), updatedBy: admin._id };
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined) updates[k] = typeof v === "string" && v.trim() === "" ? undefined : (v as string);
    }

    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("siteSettings", {
        key: SETTINGS_KEY,
        brandName: args.brandName,
        contactEmail: args.contactEmail,
        contactPhone: args.contactPhone,
        whatsapp: args.whatsapp,
        instagram: args.instagram,
        twitter: args.twitter,
        paymentProvider: args.paymentProvider,
        emailProvider: args.emailProvider,
        mapsProvider: args.mapsProvider,
        notes: args.notes,
        updatedAt: Date.now(),
        updatedBy: admin._id,
      });
    }

    await logActivity(ctx, {
      actorId: admin._id,
      action: "apartment_updated",
      resourceType: "siteSettings",
      details: "تحديث إعدادات المنصة",
    });

    return "تم حفظ الإعدادات";
  },
});
