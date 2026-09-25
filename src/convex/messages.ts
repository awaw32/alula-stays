/**
 * نظام الرسائل بين المالك والضيف
 * - المحادثة لكل (ضيف، شقة) — تُنشأ تلقائياً عند أول رسالة
 * - بيانات التواصل (الجوال) مخفية حتى وجود حجز مؤكد/مدفوع بين الطرفين
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ERROR_MESSAGES, ValidationError } from "./lib/errors";

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_MS = 10 * 1000; // رسالة كل 10 ثوانٍ كحد أدنى لكل محادثة

async function requireUser(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
  const user = await ctx.db.get(userId);
  if (!user) throw new ValidationError("المستخدم غير موجود");
  if (user.isDisabled) throw new ValidationError("حسابك معطّل — تواصل مع الدعم");
  return user;
}

/**
 * هل بيانات التواصل مكشوفة بين الطرفين؟
 * فقط عند وجود حجز مؤكد أو مكتمل (وليس ملغى) بين الضيف والمالك.
 */
async function contactRevealed(
  ctx: QueryCtx | MutationCtx,
  guestId: string,
  ownerId: string,
): Promise<boolean> {
  const guestBookings = await ctx.db
    .query("bookings")
    .withIndex("by_user", (q) => q.eq("userId", guestId as never))
    .collect();

  const ownerApartments = await ctx.db
    .query("apartments")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId as never))
    .collect();
  const ownerApartmentIds = new Set(ownerApartments.map((a) => a._id));

  return guestBookings.some(
    (b) =>
      ownerApartmentIds.has(b.apartmentId) &&
      (b.status === "confirmed" || b.status === "completed"),
  );
}

/**
 * جلب أو إنشاء محادثة حول شقة — للضيف.
 * يمنع المالك من مراسلة نفسه.
 */
export const getOrCreate = mutation({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) throw new ValidationError("الشقة غير موجودة");
    if (!apartment.ownerId) throw new ValidationError("الشقة بلا مالك مسجل");
    if (apartment.ownerId === user._id) {
      throw new ValidationError("هذه شقتك — أنت لا تراسل نفسك");
    }

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();
    const mine = existing.find((c) => c.guestId === user._id);
    if (mine) return mine._id;

    return await ctx.db.insert("conversations", {
      apartmentId: args.apartmentId,
      guestId: user._id,
      ownerId: apartment.ownerId,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

/** إرسال رسالة في محادثة (للطرفين فقط) */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new ValidationError("المحادثة غير موجودة");
    if (conversation.guestId !== user._id && conversation.ownerId !== user._id) {
      throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = args.body.trim();
    if (!body) throw new ValidationError("اكتب رسالة قبل الإرسال");
    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new ValidationError(`الرسالة طويلة — الحد ${MAX_MESSAGE_LENGTH} حرف`);
    }

    // منع السبام البسيط
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(1);
    if (
      recent[0] &&
      recent[0].senderId === user._id &&
      Date.now() - recent[0].createdAt < RATE_LIMIT_MS
    ) {
      throw new ValidationError("انتظر قليلاً قبل إرسال رسالة أخرى");
    }

    const isGuest = conversation.guestId === user._id;

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      body,
      readByGuest: isGuest,
      readByOwner: !isGuest,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: body.slice(0, 80),
    });

    // إشعار للطرف الآخر
    const recipientId = isGuest ? conversation.ownerId : conversation.guestId;
    await ctx.db.insert("notifications", {
      userId: recipientId,
      type: "message_received",
      title: "💬 رسالة جديدة",
      message: `رسالة جديدة بخصوص شقة: ${body.slice(0, 60)}${body.length > 60 ? "..." : ""}`,
      actionUrl: isGuest ? "/owner" : "/messages",
      read: false,
      createdAt: Date.now(),
    });

    return { messageId };
  },
});

/** رسائل محادثة — للأطراف فقط، مع معلومة كشف التواصل */
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new ValidationError("المحادثة غير موجودة");
    if (conversation.guestId !== user._id && conversation.ownerId !== user._id) {
      throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const messages = (await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(200)).map((m) => ({
      _id: m._id,
      isMine: m.senderId === user._id,
      body: m.body,
      createdAt: m.createdAt,
    }));
    // التعليم كمقروء يتم في markRead (mutation) من الواجهة

    const isGuest = conversation.guestId === user._id;

    const revealed = await contactRevealed(ctx, conversation.guestId, conversation.ownerId);

    // بيانات الطرف الآخر (الاسم فقط + الجوال إن كُشف)
    const otherId = isGuest ? conversation.ownerId : conversation.guestId;
    const other = await ctx.db.get(otherId);

    // الجوال من userProfiles — يُكشف فقط بعد تأكيد الحجز
    let otherPhone: string | undefined;
    if (revealed) {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", otherId as never))
        .unique();
      otherPhone = profile?.phone;
    }

    return {
      messages,
      isGuest,
      contactRevealed: revealed,
      otherParty: {
        name: other?.name ?? "مستخدم",
        phone: otherPhone,
      },
    };
  },
});

/** محادثاتي (المالك أو الضيف) — الأحدث أولاً */
export const myConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const asGuest = await ctx.db
      .query("conversations")
      .withIndex("by_guest", (q) => q.eq("guestId", user._id))
      .collect();
    const asOwner =
      user.role === "owner" || user.role === "admin"
        ? await ctx.db
            .query("conversations")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect()
        : [];

    const all = [...asGuest, ...asOwner].sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return Promise.all(
      all.map(async (c) => {
        const apartment = await ctx.db.get(c.apartmentId);
        const otherId = c.guestId === user._id ? c.ownerId : c.guestId;
        const other = await ctx.db.get(otherId);
        const unread = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", c._id))
          .collect();
        const unreadCount = unread.filter(
          (m) =>
            m.senderId !== user._id &&
            !(c.guestId === user._id ? m.readByGuest : m.readByOwner),
        ).length;
        return {
          _id: c._id,
          role: c.guestId === user._id ? ("guest" as const) : ("owner" as const),
          apartmentTitle: apartment?.title ?? "شقة",
          otherName: other?.name ?? "مستخدم",
          lastMessagePreview: c.lastMessagePreview,
          lastMessageAt: c.lastMessageAt,
          unreadCount,
        };
      }),
    );
  },
});

/** تعليم رسائل المحادثة كمقروءة للطرف الحالي */
export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new ValidationError("المحادثة غير موجودة");
    if (conversation.guestId !== user._id && conversation.ownerId !== user._id) {
      throw new ValidationError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const isGuest = conversation.guestId === user._id;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const m of messages) {
      if (isGuest && !m.readByGuest) await ctx.db.patch(m._id, { readByGuest: true });
      if (!isGuest && !m.readByOwner) await ctx.db.patch(m._id, { readByOwner: true });
    }
    return "ok";
  },
});

/** عدد الرسائل غير المقروءة (لشارة الترويسة) */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const asGuest = await ctx.db
      .query("conversations")
      .withIndex("by_guest", (q) => q.eq("guestId", userId))
      .collect();
    const user = await ctx.db.get(userId);
    const asOwner =
      user && (user.role === "owner" || user.role === "admin")
        ? await ctx.db
            .query("conversations")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .collect()
        : [];

    let count = 0;
    for (const c of [...asGuest, ...asOwner]) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", c._id))
        .collect();
      count += msgs.filter(
        (m) =>
          m.senderId !== userId &&
          !(c.guestId === userId ? m.readByGuest : m.readByOwner),
      ).length;
    }
    return count;
  },
});
