import { query, mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAnyRole, requireApartmentOwner, requireRole, requireUser } from "./lib/authorization";
import { ERROR_MESSAGES, ValidationError } from "./lib/errors";
import { logActivity } from "./lib/activityLog";

// ─── حالات دورة حياة الشقة ───

export const APARTMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_changes",
  "suspended",
] as const;

export type ApartmentStatus = (typeof APARTMENT_STATUSES)[number];

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("needs_changes"),
  v.literal("suspended"),
);

/** هل الشقة منشورة وقابلة للحجز؟ (يدعم الشقق القديمة قبل إضافة status) */
export function isApartmentLive(apartment: {
  status?: ApartmentStatus;
  isVerified?: boolean;
  available?: boolean;
}): boolean {
  if (apartment.available === false) return false;
  if (apartment.status !== undefined) return apartment.status === "approved";
  return apartment.isVerified === true;
}

/** تحديث isVerified ليتوافق مع status (للتوافق مع الشقق القديمة والفهارس) */
function verifiedFromStatus(status: ApartmentStatus): boolean {
  return status === "approved";
}

/** إشعار المالك بتغيير حالة شقته */
async function notifyOwnerStatusChange(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  apartmentId: Id<"apartments">,
  status: ApartmentStatus,
  apartmentTitle: string,
  reason?: string,
) {
  const messages: Record<ApartmentStatus, { title: string; message: string }> = {
    pending: {
      title: "⏳ شقتك قيد المراجعة",
      message: `شقتك "${apartmentTitle}" أُرسلت للمراجعة وسيراجعها فريقنا قريباً.`,
    },
    approved: {
      title: "✅ تم قبول شقتك ونشرها",
      message: `مبروك! تم قبول شقتك "${apartmentTitle}" ونشرها على المنصة — أصبحت متاحة للحجز.`,
    },
    rejected: {
      title: "❌ تم رفض شقتك",
      message: `تم رفض شقتك "${apartmentTitle}"${reason ? `. السبب: ${reason}` : ""}. يمكنك تعديلها وإعادة إرسالها للمراجعة.`,
    },
    needs_changes: {
      title: "✏️ شقتك تحتاج تعديلات",
      message: `شقتك "${apartmentTitle}" تحتاج تعديلات قبل النشر${reason ? `. المطلوب: ${reason}` : ""}. عدّلها ثم أعد إرسالها.`,
    },
    suspended: {
      title: "⏸️ تم إيقاف شقتك مؤقتاً",
      message: `تم إيقاف شقتك "${apartmentTitle}" مؤقتاً${reason ? `. السبب: ${reason}` : ""}. تواصل مع الإدارة للتفاصيل.`,
    },
  };

  const { title, message } = messages[status];
  await ctx.db.insert("notifications", {
    userId: ownerId,
    type: "apartment_status_changed",
    title,
    message,
    relatedApartmentId: apartmentId,
    actionUrl: "/owner",
    read: false,
    createdAt: Date.now(),
  });
}

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
    weekendPrice: v.optional(v.number()),
    minNights: v.optional(v.number()),
    propertyType: v.optional(v.union(v.literal("apartment"), v.literal("chalet"), v.literal("villa"), v.literal("camp"))),
    cleaningFee: v.optional(v.number()),
    deposit: v.optional(v.number()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    petsAllowed: v.optional(v.boolean()),
    smokingAllowed: v.optional(v.boolean()),
    elevator: v.optional(v.boolean()),
    wheelchairAccessible: v.optional(v.boolean()),
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
    const user = await requireUser(ctx);

    // تحقق صارم من قواعد التسعير
    if (args.weekendPrice !== undefined && args.weekendPrice < 0) {
      throw new ValidationError("سعر نهاية الأسبوع لا يمكن أن يكون سالباً");
    }
    if (args.minNights !== undefined && (!Number.isInteger(args.minNights) || args.minNights < 1 || args.minNights > 30)) {
      throw new ValidationError("الحد الأدنى للليالي يجب أن يكون بين 1 و 30");
    }

    // أي مستخدم مسجّل يمكنه رفع شقة للمراجعة — تُرقّى صلاحيته تلقائياً إلى مالك.
    if (user.role !== "owner" && user.role !== "admin") {
      await ctx.db.patch(user._id, { role: "owner" });
    }

    const apartmentId = await ctx.db.insert("apartments", {
      ...args,
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      isFeatured: false,
      available: true,
      ownerId: user._id,
      status: "pending",
    });

    await notifyOwnerStatusChange(ctx, user._id, apartmentId, "pending", args.titleAr || args.title);

    // إشعار كل الأدمن بوجود شقة جديدة بانتظار المراجعة
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "apartment_pending_review",
        title: "🆕 شقة جديدة بانتظار المراجعة",
        message: `رفع ${user.name ?? "مالك"} شقة "${args.titleAr || args.title}" — بانتظار قرارك`,
        relatedApartmentId: apartmentId,
        actionUrl: "/admin",
        read: false,
        createdAt: Date.now(),
      });
    }

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
    weekendPrice: v.optional(v.number()),
    minNights: v.optional(v.number()),
    propertyType: v.optional(v.union(v.literal("apartment"), v.literal("chalet"), v.literal("villa"), v.literal("camp"))),
    cleaningFee: v.optional(v.number()),
    deposit: v.optional(v.number()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    petsAllowed: v.optional(v.boolean()),
    smokingAllowed: v.optional(v.boolean()),
    elevator: v.optional(v.boolean()),
    wheelchairAccessible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireApartmentOwner(ctx, args.apartmentId);

    // تحقق صارم من قواعد التسعير عند التعديل
    if (args.weekendPrice !== undefined && args.weekendPrice < 0) {
      throw new ValidationError("سعر نهاية الأسبوع لا يمكن أن يكون سالباً");
    }
    if (args.minNights !== undefined && (!Number.isInteger(args.minNights) || args.minNights < 1 || args.minNights > 30)) {
      throw new ValidationError("الحد الأدنى للليالي يجب أن يكون بين 1 و 30");
    }

    const { apartmentId, ...updates } = args;

    // إذا عدّل المالك شقته بعد رفضها أو طلب تعديلات، تعود لطابور المراجعة
    const apartment = await ctx.db.get(apartmentId);
    if (
      apartment &&
      (apartment.status === "rejected" || apartment.status === "needs_changes")
    ) {
      await ctx.db.patch(apartmentId, {
        ...updates,
        status: "pending",
        isVerified: false,
        reviewNotes: undefined,
      });
      return "تم تحديث الشقة وإعادة إرسالها للمراجعة";
    }

    await ctx.db.patch(apartmentId, updates);
    return "تم تحديث الشقة بنجاح";
  },
});

/**
 * إعادة إرسال الشقة للمراجعة بعد تعديلها (من المالك).
 */
export const resubmitApartment = mutation({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    await requireApartmentOwner(ctx, args.apartmentId);

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) {
      throw new ValidationError(ERROR_MESSAGES.APARTMENT_NOT_FOUND);
    }
    if (apartment.status === "approved") {
      throw new ValidationError("الشقة منشورة بالفعل — لا حاجة لإعادة الإرسال");
    }
    if (apartment.status === "pending") {
      throw new ValidationError("الشقة قيد المراجعة بالفعل");
    }

    await ctx.db.patch(args.apartmentId, {
      status: "pending",
      isVerified: false,
      reviewNotes: undefined,
      resubmissionCount: (apartment.resubmissionCount ?? 0) + 1,
    });

    await notifyOwnerStatusChange(
      ctx,
      apartment.ownerId!,
      args.apartmentId,
      "pending",
      apartment.titleAr || apartment.title,
    );

    return "تم إعادة إرسال الشقة للمراجعة";
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
    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("userProfiles").collect();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const bookings = await ctx.db.query("bookings").collect();

    return users.map((u) => {
      const p = profileMap.get(u._id);
      const userBookings = bookings.filter((b) => b.userId === u._id);
      const paidBookings = userBookings.filter((b) => b.paymentStatus === "paid");
      const pendingBookings = userBookings.filter(
        (b) => b.status === "pending" && b.paymentStatus === "unpaid",
      );
      const cancelledBookings = userBookings.filter(
        (b) => b.status === "cancelled",
      );
      const totalSpent = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

      return {
        ...u,
        phone: p?.phone || "",
        city: p?.city || "",
        country: p?.country || "",
        bookingsCount: userBookings.length,
        paidBookingsCount: paidBookings.length,
        pendingBookingsCount: pendingBookings.length,
        cancelledBookingsCount: cancelledBookings.length,
        totalSpent,
      };
    });
  },
});

/**
 * تغيير حالة الشقة من الأدمن: قبول / رفض / طلب تعديلات / إيقاف مؤقت.
 * يحفظ السبب وبيانات المراجعة ويرسل إشعاراً للمالك.
 */
export const adminSetApartmentStatus = mutation({
  args: {
    apartmentId: v.id("apartments"),
    status: statusValidator,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, "admin");

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) {
      throw new ValidationError(ERROR_MESSAGES.APARTMENT_NOT_FOUND);
    }

    // الرفض وطلب التعديلات والإيقاف تتطلب سباً
    if (
      (args.status === "rejected" ||
        args.status === "needs_changes" ||
        args.status === "suspended") &&
      !args.reason?.trim()
    ) {
      throw new ValidationError("يجب كتابة السبب عند الرفض أو طلب التعديلات أو الإيقاف");
    }

    await ctx.db.patch(args.apartmentId, {
      status: args.status,
      isVerified: verifiedFromStatus(args.status),
      reviewNotes: args.status === "approved" ? undefined : args.reason?.trim(),
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    if (apartment.ownerId) {
      await notifyOwnerStatusChange(
        ctx,
        apartment.ownerId,
        args.apartmentId,
        args.status,      apartment.titleAr || apartment.title,
      args.reason,
    );
    }

    const actionMap: Record<ApartmentStatus, Parameters<typeof logActivity>[1]["action"]> = {
      pending: "apartment_resubmitted",
      approved: "apartment_approved",
      rejected: "apartment_rejected",
      needs_changes: "apartment_needs_changes",
      suspended: "apartment_suspended",
    };
    await logActivity(ctx, {
      actorId: admin._id,
      action: actionMap[args.status],
      resourceType: "apartment",
      resourceId: args.apartmentId,
      details: args.reason?.trim(),
    });

    const labels: Record<ApartmentStatus, string> = {
      pending: "أُعيدت للمراجعة",
      approved: "تم قبول الشقة ونشرها",
      rejected: "تم رفض الشقة وإخفاؤها",
      needs_changes: "أُرسلت ملاحظات التعديلات للمالك",
      suspended: "تم إيقاف الشقة مؤقتاً",
    };
    return labels[args.status];
  },
});

/**
 * توافق خلفي: قبول/رفض سريع بدون سبب (يُستخدم في الرد السريع من اللوحة).
 */
export const adminVerifyApartment = mutation({
  args: {
    apartmentId: v.id("apartments"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.apartmentId, {
      status: args.verified ? "approved" : "suspended",
      isVerified: args.verified,
      reviewedAt: Date.now(),
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
    const admin = await requireRole(ctx, "admin");

    // حماية: منع الأدمن من إزالة صلاحيته بنفسه
    if (admin._id === args.userId && args.role !== "admin") {
      throw new ValidationError("لا يمكنك تغيير دورك الإداري بنفسك — اطلب من أدمن آخر ذلك");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ValidationError("المستخدم غير موجود");
    }
    if (target.role === args.role) {
      return "الدور الحالي هو نفسه — لا تغيير";
    }

    await ctx.db.patch(args.userId, { role: args.role });

    await logActivity(ctx, {
      actorId: admin._id,
      action: "role_changed",
      resourceType: "user",
      resourceId: args.userId,
      details: `من "${target.role ?? "user"}" إلى "${args.role}"`,
    });

    return "تم تحديث الدور";
  },
});

/**
 * تعطيل/تفعيل حساب مستخدم (منع من الحجز والرفع دون حذف بياناته).
 */
export const adminSetUserDisabled = mutation({
  args: {
    userId: v.id("users"),
    disabled: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, "admin");

    if (admin._id === args.userId && args.disabled) {
      throw new ValidationError("لا يمكنك تعطيل حسابك بنفسك");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ValidationError("المستخدم غير موجود");
    }

    await ctx.db.patch(args.userId, {
      isDisabled: args.disabled,
      disabledReason: args.disabled ? args.reason?.trim() || "مخالفة سياسة المنصة" : undefined,
    });

    await logActivity(ctx, {
      actorId: admin._id,
      action: args.disabled ? "user_disabled" : "user_enabled",
      resourceType: "user",
      resourceId: args.userId,
      details: args.reason?.trim(),
    });

    return args.disabled ? "تم تعطيل الحساب" : "تم تفعيل الحساب";
  },
});

/**
 * سجل النشاط الإداري — للأدمن فقط.
 */
export const adminActivityLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("activityLog")
      .order("desc")
      .take(limit);
  },
});

export const adminDashboardStats = query({
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    const users = await ctx.db.query("users").collect();
    const apartments = await ctx.db.query("apartments").collect();
    const bookings = await ctx.db.query("bookings").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const visits = await ctx.db.query("siteVisits").collect();

    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;
    const yearStart = now - 365 * 24 * 60 * 60 * 1000;

    const calcPeriod = (since: number) => {
      const bList = bookings.filter((b) => b.createdAt >= since);
      const paidList = bList.filter((b) => b.paymentStatus === "paid");
      const cancelledList = bList.filter((b) => b.status === "cancelled");
      const pendingList = bList.filter(
        (b) => b.status === "pending" && b.paymentStatus === "unpaid",
      );
      const revenue = paidList.reduce((sum, b) => sum + b.totalPrice, 0);
      const platformProfit = paidList.reduce(
        (sum, b) => sum + b.platformFee,
        0,
      );
      const ownerPayouts = revenue - platformProfit;

      const vList = visits.filter((v) => v.createdAt >= since);
      const uniqueVisitors = new Set(vList.map((v) => v.visitorId)).size;

      return {
        revenue,
        platformProfit,
        ownerPayouts,
        bookingsCount: bList.length,
        paidBookingsCount: paidList.length,
        cancelledBookingsCount: cancelledList.length,
        pendingBookingsCount: pendingList.length,
        uniqueVisitors,
        pageViews: vList.length,
      };
    };

    const todayStats = calcPeriod(todayStart);
    const weekStats = calcPeriod(weekStart);
    const monthStats = calcPeriod(monthStart);
    const yearStats = calcPeriod(yearStart);
    const allStats = calcPeriod(0);

    const activeBookings = bookings.filter(
      (b) => b.status === "confirmed" && b.checkOut > now,
    );

    // بانتظار المراجعة أو تحتاج تعديلات
    const pendingApartments = apartments.filter(
      (a) =>
        a.status === "pending" ||
        a.status === "needs_changes" ||
        (a.status === undefined && !a.isVerified),
    );

    // تفصيل الفواتير
    const paidInvoices = bookings.filter((b) => b.paymentStatus === "paid");
    const cancelledInvoices = bookings.filter((b) => b.status === "cancelled");
    const pendingInvoices = bookings.filter(
      (b) => b.status === "pending" && b.paymentStatus === "unpaid",
    );

    return {
      // إحصائيات زمنية
      today: todayStats,
      week: weekStats,
      month: monthStats,
      year: yearStats,
      all: allStats,

      // ملخص الفواتير
      invoicesSummary: {
        totalCount: bookings.length,
        paidCount: paidInvoices.length,
        paidTotal: paidInvoices.reduce((s, b) => s + b.totalPrice, 0),
        cancelledCount: cancelledInvoices.length,
        cancelledTotal: cancelledInvoices.reduce((s, b) => s + b.totalPrice, 0),
        pendingCount: pendingInvoices.length,
        pendingTotal: pendingInvoices.reduce((s, b) => s + b.totalPrice, 0),
      },

      // للتوافق مع الواجهات القائمة
      totalUsers: users.length,
      totalApartments: apartments.length,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      totalRevenue: allStats.revenue,
      platformRevenue: allStats.platformProfit,
      monthlyBookings: monthStats.bookingsCount,
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

export const adminInvoicesList = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const bookings = await ctx.db.query("bookings").order("desc").collect();
    const apartments = await ctx.db.query("apartments").collect();
    const aptMap = new Map(apartments.map((a) => [a._id, a]));
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map((u) => [u._id, u]));
    const profiles = await ctx.db.query("userProfiles").collect();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const invoices = bookings.map((b) => {
      const apt = aptMap.get(b.apartmentId);
      const guestUser = userMap.get(b.userId);
      const guestProfile = profileMap.get(b.userId);

      let ownerName = "مالك";
      let ownerPhone = "";
      if (apt?.ownerId) {
        ownerName = userMap.get(apt.ownerId)?.name || "مالك";
        ownerPhone = profileMap.get(apt.ownerId)?.phone || "";
      }

      const invoiceNumber =
        b.invoiceNumber ||
        `INV-${new Date(b.createdAt).getFullYear()}-${b._id.slice(-6).toUpperCase()}`;

      const guestName = b.guestName || guestUser?.name || "ضيف العلا";
      const guestPhone = b.guestPhone || guestProfile?.phone || "";
      const guestEmail = b.guestEmail || guestUser?.email || "";

      return {
        _id: b._id,
        invoiceNumber,
        bookingId: b._id,
        status: b.status,
        paymentStatus: b.paymentStatus,
        apartmentId: b.apartmentId,
        apartmentTitle: apt?.titleAr || apt?.title || "شقة",
        apartmentLocation: apt?.locationAr || apt?.location || "العلا",
        guestName,
        guestPhone,
        guestEmail,
        ownerName,
        ownerPhone,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalNights: b.totalNights,
        guests: b.guests,
        pricePerNight: b.pricePerNight,
        totalPrice: b.totalPrice,
        platformFee: b.platformFee,
        ownerNet: b.totalPrice - b.platformFee,
        paymentSessionId: b.paymentSessionId || "",
        paidAt: b.paidAt,
        createdAt: b.createdAt,
      };
    });

    let filtered = invoices;
    if (args.status && args.status !== "all") {
      filtered = filtered.filter(
        (inv) => inv.paymentStatus === args.status || inv.status === args.status,
      );
    }

    if (args.search && args.search.trim()) {
      const term = args.search.trim().toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.guestName.toLowerCase().includes(term) ||
          inv.guestPhone.includes(term) ||
          inv.guestEmail.toLowerCase().includes(term) ||
          inv.apartmentTitle.toLowerCase().includes(term) ||
          (inv.paymentSessionId &&
            inv.paymentSessionId.toLowerCase().includes(term)),
      );
    }

    return filtered;
  },
});
