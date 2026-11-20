import { Phone } from "@convex-dev/auth/providers/Phone";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { internal } from "../_generated/api";
import axios from "axios";

/**
 * توحيد رقم الجوال بصيغة الأرقام المباشرة للدول (مثلاً 9665xxxxxxxx)
 */
function formatPhoneDigits(phone: string): string {
  let cleaned = (phone || "").trim().replace(/[^\d]/g, "");
  cleaned = cleaned.replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)] || d);

  if (cleaned.startsWith("00966")) {
    cleaned = "966" + cleaned.slice(5);
  } else if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith("05") && cleaned.length === 10) {
    cleaned = "966" + cleaned.slice(1);
  } else if (cleaned.startsWith("5") && cleaned.length === 9) {
    cleaned = "966" + cleaned;
  }
  return cleaned;
}

/**
 * إرسال رسالة واتساب عبر بوابة Infobip
 */
async function sendViaInfobipWhatsApp(
  phoneDigits: string,
  text: string,
  token: string,
): Promise<boolean> {
  const apiKey = process.env.INFOBIP_API_KEY;
  if (!apiKey) {
    console.warn("[Infobip WhatsApp] INFOBIP_API_KEY not configured.");
    return false;
  }
  const rawBaseUrl = process.env.INFOBIP_BASE_URL || "https://55nw9j.api.infobip.com";
  const baseUrl = rawBaseUrl.startsWith("http") ? rawBaseUrl : `https://${rawBaseUrl}`;

  // رقم مرسل الواتساب: إما رقم مخصص من البيئة أو رقم Sandbox الافتراضي لـ Infobip
  let sender =
    process.env.INFOBIP_WHATSAPP_SENDER ||
    (process.env.INFOBIP_SENDER && /^\+?\d+$/.test(process.env.INFOBIP_SENDER)
      ? process.env.INFOBIP_SENDER
      : "447860099299");
  sender = sender.replace(/[^\d]/g, "");

  // المحاولة الأولى: إرسال رسالة نصية مباشرة عبر WhatsApp
  try {
    const res = await fetch(`${baseUrl}/whatsapp/1/message/text`, {
      method: "POST",
      headers: {
        Authorization: `App ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: phoneDigits,
        content: { text },
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (res.ok && data?.status?.groupName !== "REJECTED") {
      console.log(`[Infobip WhatsApp] Text message sent successfully to ${phoneDigits}`);
      return true;
    }

    console.warn(`[Infobip WhatsApp] Text attempt response (${res.status}):`, data);

    // إذا فشل بسبب Invalid Source Address، أعد المحاولة برقم Sandbox الافتراضي 447860099299
    if (sender !== "447860099299" && data?.status?.name === "REJECTED_SOURCE") {
      console.log(`[Infobip WhatsApp] Retrying with sandbox sender 447860099299...`);
      const retryRes = await fetch(`${baseUrl}/whatsapp/1/message/text`, {
        method: "POST",
        headers: {
          Authorization: `App ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          from: "447860099299",
          to: phoneDigits,
          content: { text },
        }),
      });
      const retryData: any = await retryRes.json().catch(() => ({}));
      if (retryRes.ok && retryData?.status?.groupName !== "REJECTED") {
        console.log(`[Infobip WhatsApp] Sandbox retry sent successfully to ${phoneDigits}`);
        return true;
      }
      console.warn(`[Infobip WhatsApp] Sandbox retry response:`, retryData);
    }
  } catch (err: any) {
    console.warn(`[Infobip WhatsApp] Dispatch error:`, err?.message);
  }

  // المحاولة الثانية: محاولة إرسال عبر القالب (Template) إن وجد
  try {
    const templateName = process.env.INFOBIP_WHATSAPP_TEMPLATE || "otp";
    const res = await fetch(`${baseUrl}/whatsapp/1/message/template`, {
      method: "POST",
      headers: {
        Authorization: `App ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            from: sender,
            to: phoneDigits,
            content: {
              templateName,
              templateData: { body: { placeholders: [token] } },
              language: "ar",
            },
          },
        ],
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (res.ok && data?.messages?.[0]?.status?.groupName !== "REJECTED") {
      console.log(`[Infobip WhatsApp] Template message sent successfully to ${phoneDigits}`);
      return true;
    }
    console.warn(`[Infobip WhatsApp] Template attempt response:`, data);
  } catch (tErr: any) {
    console.warn(`[Infobip WhatsApp] Template error:`, tErr?.message);
  }

  return false;
}

/**
 * إرسال SMS عبر بوابة Infobip
 */
async function sendViaInfobipSms(phoneDigits: string, text: string): Promise<boolean> {
  const apiKey = process.env.INFOBIP_API_KEY;
  if (!apiKey) return false;
  const rawBaseUrl = process.env.INFOBIP_BASE_URL || "https://55nw9j.api.infobip.com";
  const baseUrl = rawBaseUrl.startsWith("http") ? rawBaseUrl : `https://${rawBaseUrl}`;
  const sender = process.env.INFOBIP_SENDER || "AlulaStays";

  try {
    const res = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        Authorization: `App ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: phoneDigits }],
            from: sender,
            text,
          },
        ],
      }),
    });
    if (res.ok) {
      const data: any = await res.json().catch(() => ({}));
      console.log(`[Infobip SMS] Status:`, data?.messages?.[0]?.status?.name || "SENT");
      return true;
    }
    const errText = await res.text();
    console.warn(`[Infobip SMS] HTTP ${res.status}: ${errText}`);
  } catch (err: any) {
    console.warn(`[Infobip SMS] Dispatch error:`, err?.message);
  }
  return false;
}

/**
 * إرسال SMS عبر بوابة تقنيات (Taqnyat) السعودية
 */
async function sendViaTaqnyat(phoneDigits: string, text: string): Promise<boolean> {
  const bearerToken = process.env.TAQNYAT_BEARER_TOKEN;
  if (!bearerToken) return false;
  const sender = process.env.TAQNYAT_SENDER || "AlUlaStays";

  try {
    const res = await fetch("https://api.taqnyat.sa/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipients: [phoneDigits],
        sender,
        body: text,
      }),
    });
    if (res.ok) {
      console.log(`[Taqnyat] SMS sent successfully to ${phoneDigits}`);
      return true;
    }
    const errText = await res.text();
    console.warn(`[Taqnyat] HTTP ${res.status}: ${errText}`);
  } catch (err: any) {
    console.warn(`[Taqnyat] Dispatch error:`, err?.message);
  }
  return false;
}

async function handleGenerateVerificationToken() {
  const random: RandomReader = {
    read(bytes: Uint8Array) {
      crypto.getRandomValues(bytes);
    },
  };
  const alphabet = "0123456789";
  return generateRandomString(random, alphabet, 6);
}

async function handleSendVerificationRequest(
  {
    identifier: phone,
    token,
  }: {
    identifier: string;
    token: string;
  },
  ctx: any,
) {
  const destination = formatPhoneDigits(phone);
  const messageText = `رمز الدخول إلى منصة شقق العلا: ${token}\nينتهي خلال 10 دقائق. لا تشارك الرمز مع أي شخص.`;

  console.log(`[phoneOtp] Generated OTP token for ${phone} (${destination}): ${token}`);

  // 1. تسجيل الرمز في داتابيز المنصة فوراً لتيسير التحقق والاختبار الفوري
  try {
    if (ctx?.runMutation) {
      await ctx.runMutation(internal.users.recordLatestOtp, {
        phone,
        code: token,
      });
      console.log(`[phoneOtp] Recorded OTP token for ${phone} in devOtpLogs.`);
    }
  } catch (saveErr) {
    console.warn("[phoneOtp] Error recording OTP token in devOtpLogs:", saveErr);
  }

  // 2. إرسال عبر واتساب Infobip أولاً (حسب طلب المستخدم وإعدادات الخادم)
  let dispatched = false;
  try {
    dispatched = await sendViaInfobipWhatsApp(destination, messageText, token);
  } catch (waErr) {
    console.warn("[phoneOtp] WhatsApp dispatch error:", waErr);
  }

  // 3. محاولة إرسال SMS عبر Infobip إن لم تُرسل عبر واتساب
  if (!dispatched) {
    try {
      dispatched = await sendViaInfobipSms(destination, messageText);
    } catch (smsErr) {
      console.warn("[phoneOtp] Infobip SMS dispatch error:", smsErr);
    }
  }

  // 4. محاولة إرسال SMS عبر تقنيات (Taqnyat) كمسار احتياطي
  if (!dispatched) {
    try {
      dispatched = await sendViaTaqnyat(destination, messageText);
    } catch (taqErr) {
      console.warn("[phoneOtp] Taqnyat dispatch error:", taqErr);
    }
  }

  // 5. مسار احتياطي إضافي عبر البريد الإلكتروني إن وُجد للمستخدم
  try {
    if (ctx?.runQuery) {
      const backupEmail = await ctx.runQuery(internal.users.getEmailByPhone, {
        phone,
      });
      if (backupEmail) {
        console.log(
          `[phoneOtp] Sending backup OTP to registered email: ${backupEmail}...`,
        );
        await axios.post(
          "https://auth.freebuff.app/send_otp",
          {
            to: backupEmail,
            otp: token,
            appName: "شقق العلا (رمز التحقق للجوال)",
          },
          {
            headers: {
              "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
            },
          },
        );
      }
    }
  } catch (emailErr) {
    console.warn("[phoneOtp] Error sending backup email OTP:", emailErr);
  }

  if (!dispatched) {
    console.log(
      `[phoneOtp] OTP registered for ${destination}. Dev fallback is active if needed.`,
    );
  }
}

const phoneConfig = {
  id: "phone-otp",
  type: "phone" as const,
  maxAge: 60 * 10, // 10 دقائق لصلاحية الرمز
  generateVerificationToken: handleGenerateVerificationToken,
  sendVerificationRequest: handleSendVerificationRequest,
};

export const phoneOtp = {
  ...Phone(phoneConfig as any),
  ...phoneConfig,
};
