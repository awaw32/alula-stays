import { getAuthUserId } from "@convex-dev/auth/server";
import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { isApartmentLive } from "./admin";

/**
 * جلب دور المستخدم الحالي إن كان مسجلاً (null للزوار).
 * يُستخدم لإظهار الشقق غير الموثقة لصاحبها والإدارة فقط.
 */
async function getViewerRole(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  return user?.role ?? null;
}

export const list = query({
  args: {
    location: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    bedrooms: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewerRole = await getViewerRole(ctx);
    const canSeeUnverified = viewerRole === "owner" || viewerRole === "admin";
    let apartments = await ctx.db.query("apartments").collect();

    // الزائر العادي والمستأجر يرون المنشور (المعتمد) فقط —
    // المالك يرى شققه بكل حالاتها ليتابعها، والإدارة ترى الكل.
    if (!canSeeUnverified) {
      apartments = apartments.filter((a) => isApartmentLive(a));
    }

    if (args.location && args.location !== "all") {
      apartments = apartments.filter((a) => a.location === args.location);
    }
    if (args.minPrice !== undefined) {
      apartments = apartments.filter((a) => a.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      apartments = apartments.filter((a) => a.price <= args.maxPrice!);
    }
    if (args.bedrooms !== undefined && args.bedrooms > 0) {
      apartments = apartments.filter((a) => a.bedrooms === args.bedrooms);
    }

    switch (args.sortBy) {
      case "price-low":
        apartments.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        apartments.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        apartments.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        apartments.sort((a, b) => b._creationTime - a._creationTime);
        break;
      default:
        // featured first, then by rating
        apartments.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.rating - a.rating;
        });
    }

    return apartments;
  },
});

export const get = query({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) return null;

    // منع عرض الشقق غير المعتمدة على الزوار والمستأجرين
    if (!isApartmentLive(apartment)) {
      const viewerRole = await getViewerRole(ctx);
      if (viewerRole === "owner" || viewerRole === "admin") return apartment;
      const userId = await getAuthUserId(ctx);
      if (userId && apartment.ownerId === userId) return apartment;
      return null;
    }

    return apartment;
  },
});

export const featured = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("apartments").collect();
    return all.filter((a) => a.isFeatured && isApartmentLive(a)).slice(0, 6);
  },
});

export const locations = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("apartments").collect();
    const locs = [...new Set(all.filter((a) => isApartmentLive(a)).map((a) => a.location))];
    return locs;
  },
});

export const stats = query({
  handler: async (ctx) => {
    const all = (await ctx.db.query("apartments").collect()).filter((a) => isApartmentLive(a));
    return {
      total: all.length,
      avgPrice: all.length
        ? Math.round(all.reduce((s, a) => s + a.price, 0) / all.length)
        : 0,
      avgRating: all.length
        ? +(all.reduce((s, a) => s + a.rating, 0) / all.length).toFixed(1)
        : 0,
    };
  },
});
