import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireRole } from "./lib/authorization";
import { logActivity } from "./lib/activityLog";

/**
 * فحص حالة طلب انضمام المالك للمستخدم الحالي
 */
export const myOwnerStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        isAuthenticated: false,
        role: null,
        status: "none" as const,
        application: null,
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return {
        isAuthenticated: false,
        role: null,
        status: "none" as const,
        application: null,
      };
    }

    // إذا كان الحساب معتمداً كـ owner أو admin
    if (user.role === "owner" || user.role === "admin") {
      return {
        isAuthenticated: true,
        role: user.role,
        status: "approved" as const,
        application: null,
      };
    }

    // فحص سجل الطلب المقدم من المستخدم
    const application = await ctx.db
      .query("ownerRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!application) {
      return {
        isAuthenticated: true,
        role: user.role ?? "user",
        status: "none" as const,
        application: null,
      };
    }

    return {
      isAuthenticated: true,
      role: user.role ?? "user",
      status: application.status,
      application,
    };
  },
});

/**
 * رفع طلب الانضمام كمالك عقار جديد للإدارة
 */
export const submitOwnerApplication = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    city: v.string(),
    propertyTypes: v.optional(v.string()),
    propertyCount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً لرفع طلب الانضمام كمالك");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    if (user.role === "owner" || user.role === "admin") {
      return { status: "already_owner", message: "أنت مسجل بالفعل كمالك عقار معتمد" };
    }

    // 1. تحديث اسم المستخدم ورقم هاتفه
    await ctx.db.patch(userId, {
      name: args.fullName.trim(),
      phone: args.phone.trim(),
    });

    // 2. تحديث أو إنشاء الملف الشخصي (userProfiles)
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        phone: args.phone.trim(),
        city: args.city.trim(),
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        phone: args.phone.trim(),
        city: args.city.trim(),
        country: "المملكة العربية السعودية",
      });
    }

    // 3. إنشاء أو تجديد طلب الانضمام في جدول ownerRequests
    const existingRequest = await ctx.db
      .query("ownerRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingRequest) {
      await ctx.db.patch(existingRequest._id, {
        fullName: args.fullName.trim(),
        phone: args.phone.trim(),
        city: args.city.trim(),
        propertyTypes: args.propertyTypes?.trim(),
        propertyCount: args.propertyCount,
        notes: args.notes?.trim(),
        status: "pending",
        createdAt: Date.now(),
        reviewedAt: undefined,
        reviewedBy: undefined,
        rejectionReason: undefined,
      });
    } else {
      await ctx.db.insert("ownerRequests", {
        userId,
        fullName: args.fullName.trim(),
        phone: args.phone.trim(),
        city: args.city.trim(),
        propertyTypes: args.propertyTypes?.trim(),
        propertyCount: args.propertyCount ?? 1,
        notes: args.notes?.trim(),
        status: "pending",
        createdAt: Date.now(),
      });
    }

    // 4. إشعار للمستخدم بتأكيد استلام الطلب
    await ctx.db.insert("notifications", {
      userId,
      type: "owner_application_submitted",
      title: "⏳ تم استلام طلبك كمالك عقار",
      message: "تم رفع بياناتك للإدارة بنجاح وسيتم مراجعة وقبول حسابك في أقرب وقت ممكن.",
      read: false,
      createdAt: Date.now(),
    });

    return {
      status: "pending",
      message: "تم رفع بياناتك للإدارة بنجاح وسيتم قبول وتفعيل حسابك بأقرب وقت!",
    };
  },
});

/**
 * جلب جميع طلبات الملاك (للأدمن)
 */
export const adminListOwnerRequests = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    const requests = await ctx.db.query("ownerRequests").order("desc").collect();

    const filtered =
      !args.status || args.status === "all"
        ? requests
        : requests.filter((r) => r.status === args.status);

    const withUserDetails = await Promise.all(
      filtered.map(async (r) => {
        const u = await ctx.db.get(r.userId);
        return {
          ...r,
          userEmail: u?.email || "",
          userCurrentRole: u?.role || "user",
        };
      }),
    );

    return withUserDetails;
  },
});

/**
 * قبول طلب المالك وتفعيله فورياً (للأدمن)
 */
export const adminApproveOwnerRequest = mutation({
  args: {
    requestId: v.id("ownerRequests"),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, "admin");

    const reqDoc = await ctx.db.get(args.requestId);
    if (!reqDoc) {
      throw new Error("طلب المالك غير موجود");
    }

    // 1. تحديث حالة الطلب إلى approved
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    // 2. ترقية دور المستخدم رسمياً إلى "owner"
    await ctx.db.patch(reqDoc.userId, {
      role: "owner",
    });

    // 3. إرسال إشعار للمالك بالقبول والتهنئة
    await ctx.db.insert("notifications", {
      userId: reqDoc.userId,
      type: "owner_application_approved",
      title: "🎉 تهانينا! تم قبول حسابك كمالك عقار",
      message: "تم اعتماد حسابك رسمياً كمالك عقار في شقق العلا — يمكنك الآن رفع شققك واستقبال الحجوزات وإدارتها بكل سهولة!",
      actionUrl: "/owner",
      read: false,
      createdAt: Date.now(),
    });

    // 4. تسجيل النشاط
    await logActivity(ctx, {
      actorId: admin._id,
      action: "role_changed",
      resourceType: "user",
      resourceId: reqDoc.userId,
      details: `تمت الموافقة على طلب المالك (${reqDoc.fullName} - ${reqDoc.phone}) وترقيته إلى مالك عقار`,
    });

    return "تم قبول طلب المالك بنجاح وتفعيل لوحته";
  },
});

/**
 * رفض طلب المالك مع تسجيل السبب (للأدمن)
 */
export const adminRejectOwnerRequest = mutation({
  args: {
    requestId: v.id("ownerRequests"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, "admin");

    const reqDoc = await ctx.db.get(args.requestId);
    if (!reqDoc) {
      throw new Error("طلب المالك غير موجود");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      rejectionReason: args.reason?.trim() || "البيانات المقدمة غير كافية أو بحاجة لتوثيق إضافي",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: reqDoc.userId,
      type: "owner_application_rejected",
      title: "ملاحظات حول طلب الانضمام كمالك",
      message: args.reason?.trim() || "نعتذر، لم يتم قبول الطلب حالياً. يرجى مراجعة البيانات والمحاولة مجدداً.",
      actionUrl: "/owner",
      read: false,
      createdAt: Date.now(),
    });

    await logActivity(ctx, {
      actorId: admin._id,
      action: "role_changed",
      resourceType: "user",
      resourceId: reqDoc.userId,
      details: `تم رفض طلب المالك (${reqDoc.fullName}): ${args.reason || "بدون سبب"}`,
    });

    return "تم تسجيل رفض الطلب";
  },
});
