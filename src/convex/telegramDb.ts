import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * ربط حساب المستخدم بمعرف محادثة تليجرام عند إرسال /start <userId أو phone>
 */
export const bindTelegramChat = internalMutation({
  args: {
    payload: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, { payload, chatId }) => {
    let user = null;
    const cleanPayload = payload.trim();

    // محاولة البحث بالمعرف أولاً
    if (cleanPayload.length > 10) {
      try {
        const doc = await ctx.db.get(cleanPayload as any);
        if (doc) user = doc;
      } catch {
        // ليس معرفاً صالحاً
      }
    }

    // إذا لم نجده، نبحث برقم الهاتف
    if (!user && cleanPayload) {
      const cleanDigits = cleanPayload.replace(/\D/g, "");
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find((u) => {
        if (!u.phone) return false;
        const uClean = u.phone.replace(/\D/g, "");
        return uClean.endsWith(cleanDigits) || cleanDigits.endsWith(uClean);
      });
    }

    if (user) {
      await ctx.db.patch(user._id, { telegramChatId: chatId });
      const userName = (user as any).name || "عزيزنا المالك";
      return { success: true, name: userName };
    }

    return { success: false };
  },
});

/**
 * تحديث توفر الشقة من خلال الضغط على زر التليجرام
 */
export const updateApartmentAvailability = internalMutation({
  args: {
    apartmentId: v.string(),
    available: v.boolean(),
  },
  handler: async (ctx, { apartmentId, available }) => {
    try {
      const apt = await ctx.db.get(apartmentId as any);
      if (apt) {
        await ctx.db.patch(apt._id, { available });
        return { success: true, title: (apt as any).titleAr || (apt as any).title || "الشقة" };
      }
    } catch {
      // id غير صالح
    }
    return { success: false, title: "" };
  },
});

/**
 * جلب مالك الشقة عبر معرف Telegram
 */
export const getOwnerByChatId = internalQuery({
  args: { chatId: v.string() },
  handler: async (ctx, { chatId }) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.find((u) => u.telegramChatId === chatId) || null;
  },
});
