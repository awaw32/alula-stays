import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];

    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId as any))
      .collect();

    const enriched = await Promise.all(
      favs.map(async (fav) => {
        const apartment = await ctx.db.get(fav.apartmentId);
        return { ...fav, apartment };
      }),
    );

    return enriched.filter((f) => f.apartment);
  },
});

export const isFavorited = query({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_apartment", (q) =>
        q.eq("userId", userId as any).eq("apartmentId", args.apartmentId),
      )
      .first();

    return !!existing;
  },
});

export const toggle = mutation({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_apartment", (q) =>
        q.eq("userId", userId as any).eq("apartmentId", args.apartmentId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    } else {
      await ctx.db.insert("favorites", {
        userId: userId as any,
        apartmentId: args.apartmentId,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  },
});
