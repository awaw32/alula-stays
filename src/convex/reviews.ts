import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/authorization";

export const list = query({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
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
    const user = await requireUser(ctx);
    const comment = args.comment.trim();

    if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 5) {
      throw new Error("التقييم يجب أن يكون بين 1 و5");
    }
    if (!comment) {
      throw new Error("اكتب تعليقاً قبل إرسال التقييم");
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();
    if (existing.some((review) => review.userId === user._id)) {
      throw new Error("لقد قمت بتقييم هذه الشقة من قبل");
    }

    const completedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (!completedBookings.some((booking) => booking.apartmentId === args.apartmentId && booking.status === "completed")) {
      throw new Error("يمكنك إضافة تقييم بعد إكمال الإقامة");
    }

    const reviewId = await ctx.db.insert("reviews", {
      apartmentId: args.apartmentId,
      userId: user._id,
      userName: user.name || "مستخدم",
      rating: args.rating,
      comment,
      createdAt: Date.now(),
    });

    const allReviews = [...existing, { rating: args.rating }];
    const avgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
    await ctx.db.patch(args.apartmentId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    return reviewId;
  },
});
