/**
 * بوت واتساب لملاك شقق العلا
 * ─────────────────────────────
 * يعمل عبر Termux (Android) أو أي بيئة Node.js.
 * يراقب طابور whatsappQueue في Convex كل 5 ثوانٍ،
 * يرسل الرسائل المعلقة، ويستقبل ردود الملاك (1 أو 2).
 */
import "dotenv/config";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QR from "qrcode-terminal";
import { ConvexHttpClient } from "convex/browser";

// ━━━ إعداد Convex ━━━
const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL غير موجود في .env");
  process.exit(1);
}
const convex = new ConvexHttpClient(CONVEX_URL);

// ━━━ إعداد واتساب ━━━
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  // حفظ بيانات المصادقة عند كل تحديث
  sock.ev.on("creds.update", saveCreds);

  // إدارة الاتصال: QR + إعادة اتصال تلقائي
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("📱 امسح رمز QR التالي بجوال الواتساب:");
      QR.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ تم الاتصال بواتساب بنجاح!");
      // بدء مراقبة الطابور
      processQueue(sock);
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log(`⚠️ انقطع الاتصال (السبب: ${reason}). ${shouldReconnect ? "إعادة الاتصال..." : "تم تسجيل الخروج."}`);
      if (shouldReconnect) {
        setTimeout(startBot, 3000);
      }
    }
  });

  // ━━━ استقبال ردود الملاك ━━━
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      // تجاهل رسائل البوت نفسه
      if (msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      if (!from || !from.endsWith("@s.whatsapp.net")) continue;

      // استخراج النص من أنواع الرسائل المختلفة
      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""
      ).trim();

      if (!text) continue;

      const replyNum = Number(text);
      if (replyNum !== 1 && replyNum !== 2) {
        await sock.sendMessage(from, {
          text: "❗ الرجاء الرد بـ *1* (متاحة) أو *2* (محجوزة خارجياً) فقط.",
        });
        continue;
      }

      // استخراج رقم الهاتف بدون @s.whatsapp.net
      const phone = from.replace("@s.whatsapp.net", "");

      try {
        const res = await convex.mutation("whatsapp:recordReply", {
          ownerPhone: phone,
          reply: replyNum,
        });

        let confirmText = "";
        if (res?.action === "booking_updated") {
          confirmText = replyNum === 1
            ? "✅ تم تأكيد موافقتك على الحجز بنجاح وتم إشعار الضيف!"
            : "❌ تم تسجيل رفض الحجز بنجاح وإشعار الضيف.";
        } else {
          confirmText = replyNum === 1
            ? "✅ تم تحديث حالة شقتك: متاحة اليوم."
            : "❌ تم تحديث حالة شقتك: محجوزة خارجياً.";
        }

        await sock.sendMessage(from, { text: confirmText });
      } catch (err) {
        console.error("خطأ في تسجيل الرد:", err);
        await sock.sendMessage(from, {
          text: "⚠️ لم يتم العثور على رسالة بانتظار ردك أو حدث خطأ.",
        });
      }
    }
  });
}

// ━━━ مراقبة طابور الرسائل كل 5 ثوانٍ ━━━
async function processQueue(sock) {
  try {
    const pending = await convex.query("whatsapp:getPendingMessages", {});

    for (const item of pending) {
      try {
        const cleanPhone = (item.ownerPhone || "").replace(/\D/g, "");
        if (!cleanPhone) continue;
        const jid = cleanPhone + "@s.whatsapp.net";
        await sock.sendMessage(jid, { text: item.message });
        // تحديث الحالة إلى "sent"
        await convex.mutation("whatsapp:markMessageSent", { id: item._id });
        console.log(`📤 تم إرسال رسالة إلى ${item.ownerPhone}`);
      } catch (err) {
        console.error(`❌ فشل إرسال رسالة إلى ${item.ownerPhone}:`, err.message);
      }
    }
  } catch (err) {
    console.error("❌ خطأ في جلب الرسائل المعلقة:", err.message);
  }

  // إعادة التشغيل بعد 5 ثوانٍ
  setTimeout(() => processQueue(sock), 5000);
}

// ━━━ بدء التشغيل ━━━
console.log("🚀 بدء تشغيل بوت واتساب شقق العلا...");
startBot();
