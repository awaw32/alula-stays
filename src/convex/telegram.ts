"use node";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * إرسال رسالة إلى Telegram.
 * يُمكن تمرير لوحة أزرار inline عبر `inlineKeyboard`.
 */
export const sendTelegramMessage = internalAction({
  args: {
    chatId: v.string(),
    text: v.string(),
    inlineKeyboard: v.optional(v.any()),
  },
  handler: async (ctx, { chatId, text, inlineKeyboard }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN غير موجود في env");
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload: any = {
      chat_id: Number(chatId),
      text,
      parse_mode: "HTML",
    };
    if (inlineKeyboard) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
});

/**
 * إرسال كود تحقق (OTP) إلى المستخدم عبر Telegram.
 */
export const sendOtpMessage = internalAction({
  args: {
    chatId: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, { chatId, otp }) => {
    const text = `رمز التحقق الخاص بك هو: <b>${otp}</b>`;
    await ctx.runAction(internal.telegram.sendTelegramMessage, { chatId, text });
  },
});
