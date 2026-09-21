import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_apartment", (q) =>
        q.eq("apartmentId", args.apartmentId),
      )
      .collect();

    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    apartmentId: v.id("apartments"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .first();
    if (!user) throw new Error("المستخدم غير موجود");

    // Check if user already reviewed this apartment
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_apartment", (q) =>
        q.eq("apartmentId", args.apartmentId),
      )
      .collect();

    const alreadyReviewed = existing.some((r) => r.userId === userId);
    if (alreadyReviewed) {
      throw new Error("لقد قمت بتقييم هذه الشقة من قبل");
    }

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("التقييم يجب أن يكون بين 1 و 5");
    }

    const reviewId = await ctx.db.insert("reviews", {
      apartmentId: args.apartmentId,
      userId: userId as any,
      userName: user.name || "مستخدم",
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Update apartment rating
    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_apartment", (q) =>
        q.eq("apartmentId", args.apartmentId),
      )
      .collect();

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await ctx.db.patch(args.apartmentId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    return reviewId;
  },
});
