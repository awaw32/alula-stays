import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { requireUser } from "./lib/authorization";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = await Promise.all(
      favorites.map(async (favorite) => ({
        ...favorite,
        apartment: await ctx.db.get(favorite.apartmentId),
      })),
    );

    return enriched.filter((favorite) => favorite.apartment);
  },
});

export const isFavorited = query({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_apartment", (q) =>
        q.eq("userId", userId).eq("apartmentId", args.apartmentId),
      )
      .first();

    return Boolean(existing);
  },
});

export const toggle = mutation({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_apartment", (q) =>
        q.eq("userId", user._id).eq("apartmentId", args.apartmentId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }

    await ctx.db.insert("favorites", {
      userId: user._id,
      apartmentId: args.apartmentId,
      createdAt: Date.now(),
    });
    return { favorited: true };
  },
});
