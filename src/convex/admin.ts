import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAnyRole, requireApartmentOwner, requireRole } from "./lib/authorization";

// ─── Owner Functions ───

export const ownerApartments = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAnyRole(ctx, ["owner", "admin"]);

    return await ctx.db
      .query("apartments")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const createApartment = mutation({
  args: {
    title: v.string(),
    titleAr: v.optional(v.string()),
    description: v.string(),
    descriptionAr: v.optional(v.string()),
    price: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    maxGuests: v.number(),
    area: v.number(),
    location: v.string(),
    locationAr: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    images: v.array(v.string()),
    amenities: v.array(v.string()),
    rules: v.optional(v.array(v.string())),
    rulesAr: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAnyRole(ctx, ["owner", "admin"]);

    const apartmentId = await ctx.db.insert("apartments", {
      ...args,
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      isFeatured: false,
      available: true,
      ownerId: user._id,
    });

    return apartmentId;
  },
});

export const updateApartment = mutation({
  args: {
    apartmentId: v.id("apartments"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    price: v.optional(v.number()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    area: v.optional(v.number()),
    location: v.optional(v.string()),
    locationAr: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
    rules: v.optional(v.array(v.string())),
    rulesAr: v.optional(v.array(v.string())),
    available: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireApartmentOwner(ctx, args.apartmentId);

    const { apartmentId, ...updates } = args;
    await ctx.db.patch(apartmentId, updates);
    return "تم تحديث الشقة بنجاح";
  },
});

export const deleteApartment = mutation({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    await requireApartmentOwner(ctx, args.apartmentId);

    await ctx.db.delete(args.apartmentId);
    return "تم حذف الشقة بنجاح";
  },
});

// ─── Admin Functions ───

export const allApartments = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("apartments").collect();
  },
});

export const allUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("users").collect();
  },
});

export const adminVerifyApartment = mutation({
  args: {
    apartmentId: v.id("apartments"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.apartmentId, {
      isVerified: args.verified,
    });
    return args.verified ? "تم التوثيق" : "تم إلغاء التوثيق";
  },
});

export const adminFeatureApartment = mutation({
  args: {
    apartmentId: v.id("apartments"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.apartmentId, {
      isFeatured: args.featured,
    });
    return args.featured ? "تم التمييز" : "تم إزالة التمييز";
  },
});

export const adminUpdateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("member"),
      v.literal("owner"),
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.userId, { role: args.role });
    return "تم تحديث الدور";
  },
});

export const adminDashboardStats = query({
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    const users = await ctx.db.query("users").collect();
    const apartments = await ctx.db.query("apartments").collect();
    const bookings = await ctx.db.query("bookings").collect();
    const reviews = await ctx.db.query("reviews").collect();

    const now = Date.now();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).getTime();

    const monthlyBookings = bookings.filter(
      (b) => b.createdAt >= monthStart,
    );
    const activeBookings = bookings.filter(
      (b) => b.status === "confirmed" && b.checkOut > now,
    );
    const totalRevenue = bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const platformRevenue = bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.platformFee, 0);

    const pendingApartments = apartments.filter((a) => !a.isVerified);

    return {
      totalUsers: users.length,
      totalApartments: apartments.length,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      totalRevenue,
      platformRevenue,
      monthlyBookings: monthlyBookings.length,
      pendingVerification: pendingApartments.length,
      totalReviews: reviews.length,
      avgRating:
        apartments.length > 0
          ? Math.round(
              (apartments.reduce((s, a) => s + a.rating, 0) /
                apartments.length) *
                10,
            ) / 10
          : 0,
    };
  },
});
