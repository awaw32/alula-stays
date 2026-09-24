import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, QueryCtx } from "./_generated/server";

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
