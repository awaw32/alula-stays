import { Phone } from "@convex-dev/auth/providers/Phone";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { internal } from "../_generated/api";
import axios from "axios";

/**
 * تجهيز رقم الجوال إلى الصيغة المطلوبة في Infobip (مثلاً 9665xxxxxxxx)
 */
function formatPhoneForInfobip(phone: string): string {
  let cleaned = (phone || "").trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
  cleaned = cleaned.replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);

  if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith("05") && cleaned.length === 10) {
    cleaned = "966" + cleaned.slice(1);
  } else if (cleaned.startsWith("5") && cleaned.length === 9) {
    cleaned = "966" + cleaned;
  }
  return cleaned;
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
    const apiKey =
      process.env.INFOBIP_API_KEY ||
      "e7923b67d7307866885e643173c76eaf-08b56421-648d-44a2-955a-9fe6d95e27e8";
    const rawBaseUrl =
      process.env.INFOBIP_BASE_URL || "https://55nw9j.api.infobip.com";
    const baseUrl = rawBaseUrl.startsWith("http")
      ? rawBaseUrl
      : `https://${rawBaseUrl}`;
    const sender = process.env.INFOBIP_SENDER || "AlulaStays";

    const destination = formatPhoneForInfobip(phone);
    const messageText = `رمز الدخول إلى منصة شقق العلا: ${token}\nينتهي خلال 10 دقائق. لا تشارك الرمز مع أي شخص.`;

    console.log(`[phoneOtp] Generated code for ${phone} (${destination}): ${token}`);

    // 1. الإرسال عبر Infobip SMS
    const payload = {
      messages: [
        {
          destinations: [{ to: destination }],
          from: sender,
          text: messageText,
        },
      ],
    };

    try {
      const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
        method: "POST",
        headers: {
          Authorization: `App ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Infobip] SMS Response HTTP ${response.status}:`, errorText);
      } else {
        const data: any = await response.json();
        console.log(
          `[Infobip] SMS Result:`,
          data?.messages?.[0]?.status?.name || data?.messages?.[0]?.status?.groupName,
        );
      }
    } catch (err: any) {
      console.warn("[Infobip] Error during SMS dispatch:", err?.message);
    }

    // 2. قناة احتياطية: إذا كان رقم الجوال مرتبطاً بحساب مسجل وله بريد إلكتروني، يُرسل الرمز للإيميل فوراً لضمان عدم تعطل المستخدم
    try {
      if (ctx?.runQuery) {
        const backupEmail = await ctx.runQuery(internal.users.getEmailByPhone, {
          phone,
        });
        if (backupEmail) {
          console.log(`[phoneOtp] Sending backup OTP to email: ${backupEmail}...`);
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
