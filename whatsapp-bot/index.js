/**
 * بوت واتساب الموحد ونظام التشغيل والمراقبة لمنصة شقق العلا
 * ─────────────────────────────────────────────────────────────
 * يعمل عبر بيئة Termux (Poco X5 Pro) أو أي بيئة Node.js.
 * - يراقب طابور whatsappQueue في Convex كل 5 ثوانٍ ويرسل الرسائل.
 * - يراقب صحة الجهاز والبطارية كل 15 دقيقة وينبه الإدارة عند الطوارئ.
 * - يستقبل أوامر الإدارة (ChatOps) عبر الرقم المعتمد: 966506709265
 * - يستقبل ردود الملاك (1 أو 2) وتقييمات النزلاء (1 إلى 5).
 * - يتفاعل مع العملاء بقائمة ترحيبية ذكية وروابط سريعة مع Cooldown ساعتين.
 */
import "dotenv/config";
import { exec } from "child_process";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QR from "qrcode-terminal";
import { ConvexHttpClient } from "convex/browser";

// ━━━ الإعدادات والثوابت ━━━
const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL غير موجود في .env");
  process.exit(1);
}
const convex = new ConvexHttpClient(CONVEX_URL);

/** رقم الإدارة المعتمد للأوامر والتنبيهات والتقارير */
const ADMIN_PHONE = "966506709265";
const ADMIN_JID = `${ADMIN_PHONE}@s.whatsapp.net`;

/** تتبع Cooldown للتنبيهات والقوائم */
let lastBatteryAlertTime = 0;
let lastTempAlertTime = 0;
const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const customerWelcomeCooldown = new Map();

// ━━━ فحص صحة الجهاز وسيرفر Termux ━━━
function checkServerHealth(sock) {
  exec("termux-battery-status", (err, stdout) => {
    if (err || !stdout) return; // ليس بيئة Termux أو الأمر غير مدعوم
    try {
      const data = JSON.parse(stdout);
      const percentage = Number(data.percentage);
      const status = String(data.status || "").toUpperCase();
      const temperature = Number(data.temperature);
      const now = Date.now();

      // 1. تنبيه البطارية: <= 20% والشاحن غير موصول
      if (percentage <= 20 && status === "DISCHARGING") {
        if (now - lastBatteryAlertTime > ONE_HOUR_MS) {
          lastBatteryAlertTime = now;
          const msg =
            `⚠️ *تنبيه حرج لسيرفر البوت (Poco X5)*:\n\n` +
            `🔋 نسبة البطارية منخفضة: *${percentage}%*\n` +
            `🔌 حالة الشحن: *${status}*\n\n` +
            `يرجى توصيل الشاحن فوراً لتجنب توقف بوت الواتساب وأكواد التحقق! ⚡`;
          sock.sendMessage(ADMIN_JID, { text: msg }).catch(() => {});
        }
      }

      // 2. تنبيه الحرارة: >= 42°C
      if (temperature >= 42) {
        if (now - lastTempAlertTime > ONE_HOUR_MS) {
          lastTempAlertTime = now;
          const msg =
            `🔥 *تنبيه حرارة مرتفعة لسيرفر البوت (Poco X5)*:\n\n` +
            `🌡️ درجة الحرارة: *${temperature}°C*\n` +
            `🔋 البطارية: *${percentage}%*\n\n` +
            `يرجى نقل الجهاز لمكان بارد أو فصل الشحن السريع لحمايته! ❄️`;
          sock.sendMessage(ADMIN_JID, { text: msg }).catch(() => {});
        }
      }
    } catch {}
  });
}

// ━━━ معالجة أوامر الإدارة ChatOps ━━━
async function handleAdminCommand(sock, from, text) {
  const cmd = text.trim();

  // 1. أمر فحص الحالة
  if (cmd === "/حالة" || cmd === "/status") {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const uptimeStr = `${hours} ساعة و ${minutes} دقيقة`;

    exec("termux-battery-status", async (err, stdout) => {
      let batteryInfo = "بيئة Node.js (غير متاحة قراءة بطارية Termux)";
      let tempInfo = "غير متاح";
      let statusInfo = "متصل بالكهرباء";

      if (!err && stdout) {
        try {
          const data = JSON.parse(stdout);
          batteryInfo = `${data.percentage}%`;
          statusInfo = data.status || "UNKNOWN";
          tempInfo = `${data.temperature}°C`;
        } catch {}
      }

      const statusMsg =
        `🤖 *حالة خادم بوت شقق العلا (Poco X5)*:\n\n` +
        `✅ *الاتصال:* متصل بواتساب وقاعدة البيانات بنجاح\n` +
        `🔋 *البطارية:* ${batteryInfo}\n` +
        `🔌 *حالة الشحن:* ${statusInfo}\n` +
        `🌡️ *درجة الحرارة:* ${tempInfo}\n` +
        `⏱️ *مدة التشغيل:* ${uptimeStr}\n` +
        `📡 *طابور الرسائل:* يراقب طابور Convex كل 5 ثوانٍ\n\n` +
        `كافة الخدمات تعمل بانتظام 🌿✨`;

      await sock.sendMessage(from, { text: statusMsg });
    });
    return true;
  }

  // 2. أمر التقرير اليومي الفوري
  if (cmd === "/اليوم" || cmd === "/today") {
    try {
      await sock.sendMessage(from, { text: "⏳ جارٍ جلب التقرير اليومي من قاعدة البيانات..." });
      const reportText = await convex.query("analytics:getDailyAdminReportText", {});
      await sock.sendMessage(from, { text: reportText });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ تعذر جلب التقرير اليومي: ${err.message}` });
    }
    return true;
  }

  // 3. أمر عرض البلاغات المفتوحة
  if (cmd === "/بلاغات" || cmd === "/reports") {
    try {
      const reports = await convex.query("reports:getLatestOpenReports", { limit: 5 });
      if (!reports || reports.length === 0) {
        await sock.sendMessage(from, {
          text: "✅ لا توجد أي بلاغات معلقة حالياً. المنصة تعمل بسلاسة وبدون شكاوى!",
        });
        return true;
      }

      let repMsg = `🚨 *آخر البلاغات المفتوحة (${reports.length})*:\n\n`;
      reports.forEach((r, idx) => {
        const dateStr = new Date(r.createdAt).toLocaleDateString("ar-SA");
        repMsg +=
          `*${idx + 1}.* ${r.targetTitle} (${r.targetType === "apartment" ? "شقة" : r.targetType})\n` +
          `   ⚠️ *السبب:* ${r.reason}\n` +
          `   📝 *التفاصيل:* ${r.details}\n` +
          `   📅 *التاريخ:* ${dateStr}\n\n`;
      });
      repMsg += `لإدارة البلاغات واتخاذ الإجراءات:\n🔗 https://alulahome.com/admin`;
      await sock.sendMessage(from, { text: repMsg });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ تعذر جلب البلاغات: ${err.message}` });
    }
    return true;
  }

  // 4. أمر إعادة التشغيل
  if (cmd === "/إعادة" || cmd === "/restart") {
    await sock.sendMessage(from, { text: "🔄 جاري إعادة تشغيل البوت عبر PM2..." });
    setTimeout(() => {
      exec("pm2 restart whatsapp-bot", (err) => {
        if (err) {
          console.error("فشل أمر pm2 restart:", err);
          process.exit(1); // إغلاق ليقوم pm2 بإعادة تشغيله تلقائياً
        }
      });
    }, 1500);
    return true;
  }

  // 5. أمر التحديث التلقائي وسحب كود GitHub عن بُعد
  if (cmd === "/تحديث" || cmd === "/update") {
    await sock.sendMessage(from, {
      text: "⏳ جاري سحب آخر التحديثات من GitHub وتثبيت التبعيات وإعادة تشغيل البوت...",
    });

    // التنفيذ في المجلد الأب (المستودع الرئيسي) ثم مجلد البوت
    // يدعم كل من Termux و Linux و Windows
    const updateCommand = "git pull && npm install && pm2 restart whatsapp-bot";

    exec(updateCommand, async (err, stdout, stderr) => {
      if (err) {
        console.error("❌ فشل أمر التحديث /تحديث:", err);
        const errMsg =
          `❌ *فشل التحديث التلقائي عبر Git*:\n\n` +
          `\`\`\`\n${(err.message || stderr || "خطأ غير معروف").slice(0, 300)}\n\`\`\`\n` +
          `يرجى التحقق من المستودع على الجوال يدوياً.`;
        await sock.sendMessage(from, { text: errMsg }).catch(() => {});
      } else {
        console.log("✅ تم التحديث بنجاح:", stdout);
      }
    });
    return true;
  }

  // أوامر غير معروفة للإدارة
  const helpMsg =
    `🛠️ *أوامر تحكم الإدارة المتاحة*:\n\n` +
    `🔹 */حالة* : فحص بطارية وحرارة الجوال والاتصال\n` +
    `🔹 */اليوم* : استخراج التقرير اليومي المختصر فوراً\n` +
    `🔹 */بلاغات* : عرض آخر 5 بلاغات مفتوحة\n` +
    `🔹 */تحديث* : سحب آخر التحديثات من GitHub وإعادة التشغيل تلقائياً\n` +
    `🔹 */إعادة* : إعادة تشغيل البوت عبر PM2`;
  await sock.sendMessage(from, { text: helpMsg });
  return true;
}

// ━━━ تشغيل البوت والربط ━━━
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("📱 امسح رمز QR التالي بجوال الواتساب:");
      QR.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ تم الاتصال بواتساب بنجاح!");
      // بدء مراقبة الطابور
      processQueue(sock);
      // فحص أولي لصحة السيرفر
      checkServerHealth(sock);
      // جدولة فحص صحة السيرفر كل 15 دقيقة
      setInterval(() => checkServerHealth(sock), 15 * 60 * 1000);
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

  // ━━━ استقبال ومعالجة الرسائل الواردة ━━━
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      if (!from || !from.endsWith("@s.whatsapp.net")) continue;

      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""
      ).trim();

      if (!text) continue;

      const cleanPhone = from.replace("@s.whatsapp.net", "").replace(/\D/g, "");

      // 1. أوامر الإدارة (من رقم الإدارة 966506709265 وتبدأ بـ /)
      if (cleanPhone === ADMIN_PHONE && text.startsWith("/")) {
        await handleAdminCommand(sock, from, text);
        continue;
      }

      // 2. إذا كانت الرسالة رقماً (1 إلى 5)
      const num = Number(text);
      if (!isNaN(num) && num >= 1 && num <= 5) {
        // محاولة تسجيل الرد في Convex (موافقة/رفض حجز، توفر شقة، أو تقييم إقامة)
        try {
          const res = await convex.mutation("whatsapp:recordReply", {
            ownerPhone: cleanPhone,
            reply: num,
          });

          if (res?.action === "review_recorded") {
            await sock.sendMessage(from, {
              text: res.ownerMessage || `⭐ شكراً جزيلاً لتقييمك (${num} نجوم)! يسعدنا استضافتك دائماً في العلا 🌿`,
            });
            continue;
          }

          if (res?.action === "booking_updated") {
            const confirmText =
              num === 1
                ? "✅ تم تأكيد موافقتك على الحجز بنجاح وتم إشعار الضيف لمتابعة السداد!"
                : "❌ تم تسجيل اعتذارك عن الحجز بنجاح وإشعار الضيف بلطف.";
            await sock.sendMessage(from, { text: confirmText });
            continue;
          }

          if (res?.action === "availability_updated") {
            const confirmText =
              num === 1
                ? "✅ تم تحديث حالة شقتك: متاحة اليوم لاستقبال الحجوزات 🌴"
                : "❌ تم تحديث حالة شقتك: محجوزة خارجياً لليوم.";
            await sock.sendMessage(from, { text: confirmText });
            continue;
          }

          if (res?.ownerMessage) {
            await sock.sendMessage(from, { text: res.ownerMessage });
            continue;
          }
        } catch {
          // لم يكن الرد متعلقاً بحجز أو رسالة انتظار، ننتقل لمعالجة خيارات القائمة
        }

        // معالجة خيارات القائمة السريعة (1، 2، 3)
        if (num === 1) {
          const msg1 =
            `🏠 *شقق وشاليهات العلا الفاخرة*\n\n` +
            `يمكنك استعراض أفخم الوحدات والشاليهات المتاحة وحجزها مباشرة مع ضمان أفضل الأسعار:\n` +
            `🔗 https://alulahome.com/apartments\n\n` +
            `نتمنى لك إقامة مميزة وتجربة استثنائية! ✨`;
          await sock.sendMessage(from, { text: msg1 });
          continue;
        }

        if (num === 2) {
          const msg2 =
            `📋 *متابعة حجوزاتك وفواتيرك*\n\n` +
            `يمكنك الاطلاع على تفاصيل حجزك، الموقع، وتنزيل الفواتير الإلكترونية عبر الرابط:\n` +
            `🔗 https://alulahome.com/my-bookings\n\n` +
            `فريق شقق العلا دائماً في خدمتك! 🌴`;
          await sock.sendMessage(from, { text: msg2 });
          continue;
        }

        if (num === 3) {
          const msg3 =
            `💬 *خدمة العملاء والدعم الفني*\n\n` +
            `مرحباً بك! فريق شقق العلا متواجد لخدمتك والإجابة على أي استفسار.\n\n` +
            `تفضل بكتابة استفسارك أو طلبك هنا وسيقوم ممثل خدمة العملاء بالرد عليك ومساعدتك في أقرب وقت ممكن 🌿✨`;
          await sock.sendMessage(from, { text: msg3 });
          continue;
        }
      }

      // 3. رسائل العملاء العادية (ليست رقماً ولا أمر إدارة): إرسال القائمة الترحيبية مع Cooldown ساعتين
      const now = Date.now();
      const lastWelcome = customerWelcomeCooldown.get(cleanPhone) || 0;

      if (now - lastWelcome > TWO_HOURS_MS) {
        customerWelcomeCooldown.set(cleanPhone, now);
        const welcomeMenu =
          `أهلاً بك في شقق العلا ✨\n\n` +
          `للخدمة السريعة اختر رقماً:\n` +
          `1️⃣ تصفح الشقق والحجز المباشر\n` +
          `2️⃣ متابعة حجوزاتي\n` +
          `3️⃣ التحدث مع فريق الدعم`;
        await sock.sendMessage(from, { text: welcomeMenu });
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
        await convex.mutation("whatsapp:markMessageSent", { id: item._id });
        console.log(`📤 تم إرسال رسالة [${item.type || "عامة"}] إلى ${item.ownerPhone}`);
      } catch (err) {
        console.error(`❌ فشل إرسال رسالة إلى ${item.ownerPhone}:`, err.message);
      }
    }
  } catch (err) {
    console.error("❌ خطأ في جلب الرسائل المعلقة:", err.message);
  }

  setTimeout(() => processQueue(sock), 5000);
}

// ━━━ بدء التشغيل ━━━
console.log("🚀 بدء تشغيل نظام بوت الواتساب والمراقبة لمنصة شقق العلا...");
startBot();
