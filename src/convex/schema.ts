import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  OWNER: "owner",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.OWNER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Apartments / Listings
    apartments: defineTable({
      title: v.string(),
      titleAr: v.optional(v.string()),
      description: v.string(),
      descriptionAr: v.optional(v.string()),
      price: v.number(), // SAR per night
      bedrooms: v.number(),
      bathrooms: v.number(),
      maxGuests: v.number(),
      area: v.number(), // square meters
      location: v.string(), // area name in AlUla
      locationAr: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      images: v.array(v.string()), // array of image URLs
      amenities: v.array(v.string()),
      rating: v.number(),
      reviewCount: v.number(),
      isVerified: v.optional(v.boolean()),
      isFeatured: v.optional(v.boolean()),
      badges: v.optional(v.array(v.string())),
      rules: v.optional(v.array(v.string())),
      rulesAr: v.optional(v.array(v.string())),
      ownerId: v.optional(v.id("users")),
      available: v.optional(v.boolean()),
    })
      .index("by_location", ["location"])
      .index("by_price", ["price"])
      .index("by_rating", ["rating"])
      .index("by_featured", ["isFeatured"]),

    // Reviews
    reviews: defineTable({
      apartmentId: v.id("apartments"),
      userId: v.id("users"),
      userName: v.string(),
      rating: v.number(),
      comment: v.string(),
      createdAt: v.number(),
    })
      .index("by_apartment", ["apartmentId"])
      .index("by_user", ["userId"]),

    // Bookings
    bookings: defineTable({
      apartmentId: v.id("apartments"),
      userId: v.id("users"),
      checkIn: v.number(), // timestamp
      checkOut: v.number(), // timestamp
      guests: v.number(),
      totalNights: v.number(),
      pricePerNight: v.number(),
      totalPrice: v.number(),
      platformFee: v.number(), // 10% commission
      status: v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled"),
        v.literal("completed"),
      ),
      paymentStatus: v.union(
        v.literal("unpaid"),
        v.literal("paid"),
        v.literal("refunded"),
      ),
      createdAt: v.number(),
    })
      .index("by_apartment", ["apartmentId"])
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_checkin", ["checkIn"]),

    // Favorites
    favorites: defineTable({
      userId: v.id("users"),
      apartmentId: v.id("apartments"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_apartment", ["apartmentId"])
      .index("by_user_apartment", ["userId", "apartmentId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
