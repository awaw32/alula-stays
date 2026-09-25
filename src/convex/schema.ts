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

      // تعطيل الحساب من الأدمن
      isDisabled: v.optional(v.boolean()),
      disabledReason: v.optional(v.string()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Apartments / Listings
    apartments: defineTable({
      title: v.string(),
      titleAr: v.optional(v.string()),
      description: v.string(),
      descriptionAr: v.optional(v.string()),
      price: v.number(), // SAR per night
      weekendPrice: v.optional(v.number()), // سعر ليلة نهاية الأسبوع (الخميس/الجمعة) — إن اختلفت عن الأساسي
      minNights: v.optional(v.number()), // الحد الأدنى لعدد الليالي
      propertyType: v.optional(
        v.union(
          v.literal("apartment"),
          v.literal("chalet"),
          v.literal("villa"),
          v.literal("camp"),
        ),
      ), // نوع العقار
      cleaningFee: v.optional(v.number()), // رسوم التنظيف (مرة واحدة)
      deposit: v.optional(v.number()), // مبلغ التأمين المسترد
      checkInTime: v.optional(v.string()), // وقت تسجيل الدخول مثل "15:00"
      checkOutTime: v.optional(v.string()), // وقت تسجيل الخروج مثل "12:00"
      petsAllowed: v.optional(v.boolean()), // الحيوانات الأليفة
      smokingAllowed: v.optional(v.boolean()), // التدخين
      elevator: v.optional(v.boolean()), // مصعد
      wheelchairAccessible: v.optional(v.boolean()), // وصول ذوي الإعاقة
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

      // دورة حياة الشقة: بانتظار المراجعة → مقبولة/مرفوضة/تحتاج تعديلات → موقوفة
      status: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("approved"),
          v.literal("rejected"),
          v.literal("needs_changes"),
          v.literal("suspended"),
        ),
      ),
      reviewNotes: v.optional(v.string()), // سبب الرفض أو ملاحظات الأدمن
      reviewedBy: v.optional(v.id("users")), // الأدمن الذي راجع الشقة
      reviewedAt: v.optional(v.number()), // تاريخ آخر مراجعة
      resubmissionCount: v.optional(v.number()), // عدد مرات إعادة الإرسال بعد الرفض
    })
      .index("by_location", ["location"])
      .index("by_price", ["price"])
      .index("by_rating", ["rating"])
      .index("by_featured", ["isFeatured"])
      .index("by_owner", ["ownerId"]),

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
      paymentSessionId: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_apartment", ["apartmentId"])
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_checkin", ["checkIn"])
      .index("by_payment_session", ["paymentSessionId"]),

    // التواريخ المحجوبة يدوياً من المالك (صيانة، حظر أيام، إلخ)
    blockedDates: defineTable({
      apartmentId: v.id("apartments"),
      startDate: v.number(), // بداية الفترة المحجوبة (timestamp، بداية اليوم)
      endDate: v.number(), // نهاية الفترة المحجوبة (timestamp، نهاية اليوم)
      reason: v.optional(v.string()), // سبب الحجب (صيانة، استخدام شخصي...)
      ownerId: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_apartment", ["apartmentId"])
      .index("by_owner", ["ownerId"]),

    // ━━━ نظام مستحقات المالكين ━━━

    // بيانات التحويل البنكي للمالك
    ownerPayoutAccounts: defineTable({
      ownerId: v.id("users"),
      iban: v.string(),
      accountHolderName: v.string(),
      bankName: v.optional(v.string()),
      updatedAt: v.number(),
    })
      .index("by_owner", ["ownerId"]),

    // سجل تحويلات المستحقات (يُسجّل يدوياً من الأدمن حتى ربط مزود تحويل)
    payouts: defineTable({
      ownerId: v.id("users"),
      amount: v.number(),
      bookingIds: v.optional(v.array(v.id("bookings"))), // الحجوزات المشمولة
      method: v.union(v.literal("manual_transfer"), v.literal("bank")),
      reference: v.optional(v.string()), // رقم المرجع/الحوالة
      status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
      note: v.optional(v.string()),
      recordedBy: v.id("users"), // الأدمن الذي سجل التحويل
      createdAt: v.number(),
      completedAt: v.optional(v.number()),
    })
      .index("by_owner", ["ownerId"])
      .index("by_status", ["status"]),

    // Favorites
    favorites: defineTable({
      userId: v.id("users"),
      apartmentId: v.id("apartments"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_apartment", ["apartmentId"])
      .index("by_user_apartment", ["userId", "apartmentId"]),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // جداول الميزات الجديدة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // الإشعارات
    notifications: defineTable({
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      relatedBookingId: v.optional(v.id("bookings")),
      relatedApartmentId: v.optional(v.id("apartments")),
      actionUrl: v.optional(v.string()),
      read: v.boolean(),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_read", ["read"]),

    // صور الشقق
    apartmentImages: defineTable({
      apartmentId: v.id("apartments"),
      storageId: v.string(), // معرف الصورة في التخزين
      title: v.string(),
      description: v.optional(v.string()),
      isPrimary: v.boolean(),
      uploadedAt: v.number(),
    })
      .index("by_apartment", ["apartmentId"]),

    // التقييمات المحدثة (نسخة جديدة)
    reviews_new: defineTable({
      bookingId: v.id("bookings"),
      apartmentId: v.id("apartments"),
      ownerId: v.id("users"),
      guestId: v.id("users"),
      rating: v.number(), // 1-5
      title: v.string(),
      comment: v.string(),
      helpful: v.number(),
      unhelpful: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_apartment", ["apartmentId"])
      .index("by_owner", ["ownerId"])
      .index("by_guest", ["guestId"]),

    // سجل البريد الإلكتروني
    emailLog: defineTable({
      to: v.string(),
      subject: v.string(),
      type: v.string(),
      status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
      messageId: v.optional(v.string()),
      error: v.optional(v.string()),
      sentAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_email", ["to"]),

    // سجل النشاط والـ Logging
    activityLog: defineTable({
      userId: v.optional(v.id("users")),
      action: v.string(),
      resourceType: v.string(),
      resourceId: v.optional(v.string()),
      details: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      timestamp: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_action", ["action"]),

    // تحديثات المستخدم الإضافية
    userProfiles: defineTable({
      userId: v.id("users"),
      bio: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      profileImageStorageId: v.optional(v.string()),
      profileImageUpdatedAt: v.optional(v.number()),
      language: v.optional(v.string()),
      currency: v.optional(v.string()),
      notificationPreferences: v.optional(
        v.object({
          emailNotifications: v.optional(v.boolean()),
          bookingNotifications: v.optional(v.boolean()),
          promotions: v.optional(v.boolean()),
        })
      ),
      verifiedAt: v.optional(v.number()),
      identityVerified: v.optional(v.boolean()),
    })
      .index("by_user", ["userId"]),

    // جداول أخرى احتياطية
    backups: defineTable({
      name: v.string(),
      timestamp: v.number(),
      size: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed")
      ),
    }),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
