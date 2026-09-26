import { Phone } from "@convex-dev/auth/providers/Phone";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

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
  async sendVerificationRequest({
    identifier: phone,
    token,
  }: {
    identifier: string;
    token: string;
  }) {
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

    const payload = {
      messages: [
        {
          destinations: [{ to: destination }],
          from: sender,
          text: messageText,
        },
      ],
    };

    console.log(`[Infobip] Sending OTP to ${destination}...`);

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
        console.error(
          `[Infobip] HTTP ${response.status} Error sending SMS:`,
          errorText,
        );
        throw new Error(`فشل إرسال رسالة التحقق: ${response.status}`);
      }

      const data: any = await response.json();
      const status = data?.messages?.[0]?.status;
      console.log(
        `[Infobip] SMS successfully dispatched. MessageId: ${data?.messages?.[0]?.messageId}, Status:`,
        status?.name || status?.groupName,
      );
    } catch (err: any) {
      console.error("[Infobip] Error during SMS dispatch:", err);
      throw new Error(err.message || "فشل الاتصال بمزود الرسائل القصيرة");
    }
  },
};
