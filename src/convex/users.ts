import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, internalMutation, QueryCtx } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

/**
 * ترقية الحساب الحالي إلى "مالك" ليتمكن من إضافة شقق تُعرض للمراجعة.
 * أي مستخدم مسجّل يمكنه الترقية — الإدارة تراجع الشقق المرفوعة قبل نشرها.
 */
export const becomeOwner = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    // admin و owner يبقيان كما هما — الترقية فقط من user/member/بدون دور
    if (user.role === "owner" || user.role === "admin") {
      return user.role;
    }

    await ctx.db.patch(userId, { role: "owner" });
    return "owner";
  },
});

/**
 * قراءة بيانات الملف الشخصي للمستخدم (الاسم والجوال وغيرها).
 * يستخدم في استمارة أول تسجيل لمالك العقار وفي لوحة المالك.
 */
export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return {
      name: user.name ?? "",
      email: user.email ?? "",
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
      country: profile?.country ?? "",
    };
  },
});

/**
 * حفظ الملف الشخصي لمالك العقار (الاسم ورقم الجوال وبيانات التواصل).
 * تنشئ سجلاً في userProfiles إن لم يوجد، وتحدّث اسم المستخدم الأساسي.
 */
export const updateProfile = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    await ctx.db.patch(userId, { name: args.name.trim() });

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        phone: args.phone,
        city: args.city,
        country: args.country,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        phone: args.phone,
        city: args.city,
        country: args.country,
      });
    }

    return "تم حفظ البيانات";
  },
});

/**
 * فحص ما إذا كان هناك أي مدير مسجل في المنصة.
 */
export const hasAdmin = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.some((u) => u.role === "admin");
  },
});

/**
 * تعيين أول مدير للمنصة — مسموح فقط إذا لم يكن هناك أي مدير مسجل بعد.
 */
export const claimFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const allUsers = await ctx.db.query("users").collect();
    const existingAdmin = allUsers.find((u) => u.role === "admin");
    if (existingAdmin) {
      throw new Error("يوجد مدير للمنصة بالفعل — اطلب منه منحك الصلاحية من لوحة الإدارة");
    }

    await ctx.db.patch(userId, { role: "admin" });
    return "تم تعيينك مديراً للمنصة بنجاح";
  },
});

/**
 * تعيين أي مستخدم كمدير بواسطة البريد الإلكتروني (دالة داخلية آمنة للمسؤول وسطر الأوامر).
 */
export const setAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const targetEmail = args.email.toLowerCase().trim();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", targetEmail))
      .first();

    if (!user) {
      throw new Error(`لم يتم العثور على مستخدم بالبريد: ${targetEmail}`);
    }

    await ctx.db.patch(user._id, { role: "admin" });
    return `تم ترقية المستخدم (${user.name || user.email}) كمدير بنجاح`;
  },
});


