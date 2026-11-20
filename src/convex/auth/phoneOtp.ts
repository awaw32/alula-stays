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

/**
 * إرسال SMS عبر بوابة Infobip
 */
async function sendViaInfobip(phoneDigits: string, text: string): Promise<boolean> {
  const apiKey =
    process.env.INFOBIP_API_KEY ||
    "e7923b67d7307866885e643173c76eaf-08b56421-648d-44a2-955a-9fe6d95e27e8";
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
      const data: any = await res.json();
      console.log(`[Infobip] SMS Status:`, data?.messages?.[0]?.status?.name || "SENT");
      return true;
    }
    const errText = await res.text();
    console.warn(`[Infobip] HTTP ${res.status}: ${errText}`);
  } catch (err: any) {
    console.warn(`[Infobip] Dispatch error:`, err?.message);
  }
  return false;
}

export const phoneOtp = {
  ...Phone({
    sendVerificationRequest: async () => {}, // overridden below
  }),
  id: "phone-otp",
  type: "phone" as const,
  maxAge: 60 * 10, // 10 دقائق لصلاحية الرمز
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest(
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
      }
    } catch (saveErr) {
      console.warn("[phoneOtp] Error recording OTP token:", saveErr);
    }

    // 2. محاولة الإرسال المباشر عبر بوابة Infobip باستخدام المتغيرات البيئية
    try {
      const apiKey = process.env.INFOBIP_API_KEY;
      const baseUrl = process.env.INFOBIP_BASE_URL || "https://55nw9j.api.infobip.com";
      const sender = process.env.INFOBIP_SENDER || "AlulaStays";

      if (!apiKey) {
        console.error(
          "[phoneOtp] CRITICAL: INFOBIP_API_KEY environment variable is not defined. SMS will not be sent.",
        );
        throw new Error(
          "Missing INFOBIP_API_KEY environment variable. Configure it in Convex Dashboard.",
        );
      }

      console.log(`[phoneOtp] Attempting to send SMS via Infobip to ${destination}`);

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
              destinations: [{ to: destination }],
              from: sender,
              text: messageText,
            },
          ],
        }),
      });

      // تسجيل الحالة الكاملة للرد في السجلات لمراقبة الأداء
      const responseBody = await res.json();
      
      if (res.ok) {
        console.log(
          `[phoneOtp] Infobip SMS sent successfully. Status: ${res.status}`,
        );
        console.log("[phoneOtp] Infobip Response Body:", responseBody);
        // ملاحظة: يمكن هنا إضافة رمز للتسجيل الفوري إذا أردنا التأكد من التسليم
      } else {
        // الخطأ هنا من Infobip (رفض الطلب، رصيد منتهي، تنسيق رقم خاطئ)
        console.error(
          `[phoneOtp] Infobip HTTP Error ${res.status}:`,
          responseBody,
        );
        // نطرح الخطأ ليمرر للأعلى أو نتعامل معه كحالة فشل
        throw new Error(
          `Failed to send SMS via Infobip: HTTP ${res.status} - ${JSON.stringify(responseBody)}`,
        );
      }
    } catch (err: any) {
      console.error("[phoneOtp] Error during Infobip SMS send:", err);
      // إعادةThrowable الخطأ لضمان تسجيله في سجلات Convex ومراقبته
      throw new Error(`SMS sending failed: ${err.message}`);
    }

    // 3. مسار احتياطي إضافي عبر البريد الإلكتروني إن وُجد للمستخدم
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
  },
};
