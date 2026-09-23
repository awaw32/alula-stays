/**
 * نظام الإشعارات الفوري
 * إشعارات حقيقية للمستخدمين عند حدث معين
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_FAILED: "payment_failed",
  NEW_REVIEW: "new_review",
  MESSAGE_RECEIVED: "message_received",
} as const;

/**
 * إنشاء إشعار جديد
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    relatedBookingId: v.optional(v.id("bookings")),
    relatedApartmentId: v.optional(v.id("apartments")),
    actionUrl: v.optional(v.string()),
    read: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      relatedBookingId: args.relatedBookingId,
      relatedApartmentId: args.relatedApartmentId,
      actionUrl: args.actionUrl,
      read: args.read || false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * الحصول على إشعارات المستخدم
 */
export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("يجب تسجيل الدخول");
    }

    const limit = args.limit || 20;
    const skip = args.skip || 0;

    // البحث عن المستخدم
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // جلب إشعارات المستخدم
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .skip(skip)
      .take(limit)
      .collect();

    return notifications;
  },
});

/**
 * الحصول على عدد الإشعارات غير المقروءة
 */
export const getUnreadCount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * تحديد إشعار كمقروء
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("الإشعار غير موجود");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });

    return "تم تحديد الإشعار كمقروء";
  },
});

/**
 * تحديد جميع الإشعارات كمقروءة
 */
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("يجب تسجيل الدخول");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const notification of notifications) {
      if (!notification.read) {
        await ctx.db.patch(notification._id, {
          read: true,
          readAt: Date.now(),
        });
      }
    }

    return `تم تحديد ${notifications.length} إشعار`;
  },
});

/**
 * حذف إشعار
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return "تم حذف الإشعار";
  },
});

/**
 * حذف جميع الإشعارات المقروءة
 */
export const clearReadNotifications = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("يجب تسجيل الدخول");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("read"), true))
      .collect();

    let deletedCount = 0;
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
      deletedCount++;
    }

    return `تم حذف ${deletedCount} إشعار`;
  },
});

/**
 * إشعار تأكيد الحجز
 */
export const notifyBookingConfirmed = mutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    apartmentName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      title: "✅ تم تأكيد حجزك",
      message: `تم تأكيد حجزك في ${args.apartmentName}`,
      relatedBookingId: args.bookingId,
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * إشعار إلغاء الحجز
 */
export const notifyBookingCancelled = mutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    apartmentName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      title: "❌ تم إلغاء حجزك",
      message: `تم إلغاء حجزك في ${args.apartmentName}`,
      relatedBookingId: args.bookingId,
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * إشعار استقبال الدفع
 */
export const notifyPaymentReceived = mutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      title: "💰 تم استقبال الدفع",
      message: `تم استقبال دفعتك بمبلغ ${args.amount} ريال`,
      relatedBookingId: args.bookingId,
      read: false,
      createdAt: Date.now(),
    });
  },
});
