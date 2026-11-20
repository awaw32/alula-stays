"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * إرسال رسالة SMS عبر Infobip.
 * يتوقع وجود المتغيّرات البيئية INFOBIP_API_KEY و INFOBIP_BASE_URL في env.
 */
export const sendSms = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { to, text }) => {
    const apiKey = process.env.INFOBIP_API_KEY;
    const baseUrl = process.env.INFOBIP_BASE_URL;
    if (!apiKey || !baseUrl) {
      throw new Error("INFOBIP_API_KEY أو INFOBIP_BASE_URL غير مُعرّف في env");
    }
    // تأكد من وجود https://
    const normalizedBase = baseUrl.startsWith("https://") ? baseUrl : `https://${baseUrl}`;
    const url = `${normalizedBase.replace(/\/*$/, "")}/sms/2/text/advanced`;
    const payload = {
      messages: [
        {
          from: "AlUlaHome",
          destinations: [{ to }],
          text,
        },
      ],
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `App ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Infobip SMS error: ${res.status} - ${errorBody}`);
    }
  },
});
