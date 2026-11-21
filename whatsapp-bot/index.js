/**
 * بوت واتساب الموحد ونظام التشغيل والمراقبة لمنصة شقق العلا
 * ─────────────────────────────────────────────────────────────
 * يعمل عبر بيئة Termux (Poco X5 Pro) أو أي بيئة Node.js.
 * - يراقب طابور whatsappQueue في Convex كل 5 ثوانٍ ويرسل الرسائل.
 * - يراقب صحة الجهاز والبطارية كل 15 دقيقة وينبه الإدارة عند الطوارئ.
 * - يتعرف بشكل قطعي ومضمون 100% على الأدمن (رقم الجوال أو LID).
 * - يوفر لوحة تحكم إدارية تفاعلية بالأرقام (1 إلى 6).
 * - يعزل الإدارة تماماً عن رسائل العملاء، ويمنع إرسال قوائم العملاء للأدمن.
 */
import "dotenv/config";
import dns from "dns";
import fs from "fs";
import { exec } from "child_process";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QR from "qrcode-terminal";
import WebSocket from "ws";

// تفعيل دعم WebSocket لعميل Convex في بيئة Node.js
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { anyApi as api } from "convex/server";

// ━━━ معالجة الأخطاء غير الملتقطة لمنع تعليق العملية ━━━
process.on("uncaughtException", (err) => {
  console.error("💥 uncaughtException:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 unhandledRejection:", reason);
});

// ━━━ الإعدادات والثوابت ━━━
const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL غير موجود في .env");
  process.exit(1);
}
const convex = new ConvexHttpClient(CONVEX_URL);
const convexRealtime = new ConvexClient(CONVEX_URL);

/** معرفات الأدمن القطعية (آخر 9 أرقام ومعرف LID) */
const ADMIN_PHONE_SUFFIX = "506709265";
const ADMIN_LID = "255220479201491";
const ADMIN_FALLBACK_JID = "966506709265@s.whatsapp.net";

// ━━━ متغيرات تتبع حالة الاتصال ونظام المراقبة الذاتي (Watchdog) ━━━
let isWaConnected = false;
let disconnectedSince = Date.now();
let wasOffline = false;
let lastSuccessfulPoll = Date.now();
let consecutiveDisconnects = 0;

/** تتبع Cooldown للتنبيهات وقوائم العملاء */
let lastBatteryAlertTime = 0;
let lastTempAlertTime = 0;
const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const customerWelcomeCooldown = new Map();

/**
 * فحص قطعي ومضمون 100% لمعرفة ما إذا كان المرسل هو الأدمن
 * يتحقق من كافة حقول Baileys المحتملة:
 * remoteJid, remoteJidAlt, participant, senderPn
 */
function isAdminSender(msg) {
  if (!msg || !msg.key) return false;
  const k = msg.key;
  const fields = [
    k.remoteJid,
    k.remoteJidAlt,
    k.participant,
    k.senderPn,
  ].filter(Boolean).map(String);

  const combined = fields.join(" ");
  return combined.includes(ADMIN_PHONE_SUFFIX) || combined.includes(ADMIN_LID);
}

// ━━━ قراءة حالة البطارية والشحن والحرارة بدقة من نظام أندرويد ━━━
function getBatteryAndDeviceMetrics() {
  return new Promise((resolve) => {
    // 1. المحاولة الأولى: termux-battery-status بـ timeout 3 ثوانٍ
    exec("termux-battery-status", { timeout: 3000 }, (err, stdout) => {
      if (!err && stdout) {
        try {
          const data = JSON.parse(stdout);
          const percentage = Number(data.percentage);
          const rawStatus = String(data.status || "").toUpperCase();
          const isCharging =
            rawStatus === "CHARGING" || rawStatus === "FULL";
          const chargerText = isCharging
            ? "متصل بالشاحن ⚡"
            : "غير متصل بالشاحن 🔌";
          const tempNum = Number(data.temperature);
          const tempText = !isNaN(tempNum) ? `${Math.round(tempNum)}°C` : null;

          return resolve({
            percentage: !isNaN(percentage) ? `${percentage}%` : null,
            chargerText,
            isCharging,
            tempText,
            rawPercentage: percentage,
            rawTemp: tempNum,
            rawStatus,
          });
        } catch {}
      }

      // 2. المحاولة الثانية: قراءة ملفات نظام أندرويد المباشرة (/sys/class/power_supply/battery/)
      try {
        let capacity = null;
        let chargerText = "غير متصل بالشاحن 🔌";
        let isCharging = false;
        let tempText = null;
        let rawPercentage = NaN;
        let rawTemp = NaN;
        let rawStatus = "UNKNOWN";

        // أ) نسبة البطارية
        if (fs.existsSync("/sys/class/power_supply/battery/capacity")) {
          const capStr = fs
            .readFileSync("/sys/class/power_supply/battery/capacity", "utf8")
            .trim();
          const capNum = parseInt(capStr, 10);
          if (!isNaN(capNum)) {
            capacity = `${capNum}%`;
            rawPercentage = capNum;
          }
        }

        // ب) حالة الشاحن
        if (fs.existsSync("/sys/class/power_supply/battery/status")) {
          const statStr = fs
            .readFileSync("/sys/class/power_supply/battery/status", "utf8")
            .trim();
          rawStatus = statStr.toUpperCase();
          if (rawStatus === "CHARGING" || rawStatus === "FULL") {
            chargerText = "متصل بالشاحن ⚡";
            isCharging = true;
          } else {
            chargerText = "غير متصل بالشاحن 🔌";
            isCharging = false;
          }
        }

        // ج) حرارة البطارية (تكون غالباً بوحدة عُشر الدرجة، مثلاً 345 تعني 34.5)
        if (fs.existsSync("/sys/class/power_supply/battery/temp")) {
          const tempStr = fs
            .readFileSync("/sys/class/power_supply/battery/temp", "utf8")
            .trim();
          let tNum = parseFloat(tempStr);
          if (!isNaN(tNum)) {
            if (tNum > 100) {
              tNum = tNum / 10;
            }
            rawTemp = tNum;
            tempText = `${Math.round(tNum)}°C`;
          }
        }

        if (capacity || tempText) {
          return resolve({
            percentage: capacity,
            chargerText,
            isCharging,
            tempText,
            rawPercentage,
            rawTemp,
            rawStatus,
          });
        }
      } catch {}

      // إذا لم تتوفر القراءات (مثلاً في بيئة لابتوب تطوير غير أندرويد)
      resolve({
        percentage: null,
        chargerText: "متصل بالكهرباء ⚡",
        isCharging: true,
        tempText: null,
        rawPercentage: NaN,
        rawTemp: NaN,
        rawStatus: "AC",
      });
    });
  });
}

// ━━━ تنسيق مدة التشغيل بصيغة ذكية واحترافية ━━━
function formatUptimeSmart(uptimeSec) {
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);

  if (days > 0) {
    if (hours > 0) return `${days} أيام و ${hours} ساعات`;
    return `${days} أيام`;
  }
  if (hours > 0) {
    if (minutes > 0) return `${hours} ساعات و ${minutes} دقيقة`;
    return `${hours} ساعات`;
  }
  if (minutes > 0) {
    return `${minutes} دقائق`;
  }
  return "أقل من دقيقة";
}

// ━━━ دالة موحدة لإرسال الرسائل للأدمن (تضمن الوصول للرقم الصريح وJID المرسل) ━━━
async function sendToAdmin(sock, from, messagePayload) {
  const targets = new Set();
  if (from) targets.add(from);
  targets.add(ADMIN_FALLBACK_JID);

  for (const jid of targets) {
    try {
      await sock.sendMessage(jid, messagePayload);
    } catch (err) {
      console.error(`❌ تعذر إرسال رسالة الأدمن إلى ${jid}:`, err.message);
    }
  }
}

// ━━━ فحص صحة الجهاز وسيرفر Termux ━━━
async function checkServerHealth(sock) {
  try {
    const metrics = await getBatteryAndDeviceMetrics();
    const now = Date.now();

    // 1. تنبيه البطارية: <= 20% والشاحن غير موصول
    if (
      !isNaN(metrics.rawPercentage) &&
      metrics.rawPercentage <= 20 &&
      !metrics.isCharging
    ) {
      if (now - lastBatteryAlertTime > ONE_HOUR_MS) {
        lastBatteryAlertTime = now;
        const msg =
          `⚠️ *تنبيه حرج لسيرفر البوت (Poco X5)*:\n\n` +
          `🔋 نسبة البطارية منخفضة: *${metrics.rawPercentage}%*\n` +
          `🔌 حالة الشحن: *${metrics.chargerText}*\n\n` +
          `يرجى توصيل الشاحن فوراً لتجنب توقف بوت الواتساب وأكواد التحقق! ⚡`;
        sendToAdmin(sock, null, { text: msg });
      }
    }

    // 2. تنبيه الحرارة: >= 42°C
    if (!isNaN(metrics.rawTemp) && metrics.rawTemp >= 42) {
      if (now - lastTempAlertTime > ONE_HOUR_MS) {
        lastTempAlertTime = now;
        const msg =
          `🔥 *تنبيه حرارة مرتفعة لسيرفر البوت (Poco X5)*:\n\n` +
          `🌡️ درجة الحرارة: *${metrics.tempText || `${metrics.rawTemp}°C`}*\n` +
          `🔋 البطارية: *${metrics.percentage || `${metrics.rawPercentage}%`}*\n\n` +
          `يرجى نقل الجهاز لمكان بارد أو فصل الشحن السريع لحمايته! ❄️`;
        sendToAdmin(sock, null, { text: msg });
      }
    }
  } catch {}
}

// ━━━ نص لوحة تحكم الإدارة (Admin Menu) ━━━
const ADMIN_MENU_TEXT =
  `👑 *لوحة تحكم شقق العلا (الإدارة)*\n\n` +
  `اختر رقماً للتنفيذ المباشر:\n` +
  `1️⃣ حالة السيرفر (البطارية، الشاحن، الحرارة)\n` +
  `2️⃣ ملخص اليوم (الزيارات، الدفع المتروك، الحجوزات، الإيرادات)\n` +
  `3️⃣ الإحصائيات الشهرية وإجمالي الإيرادات\n` +
  `4️⃣ البلاغات المفتوحة ومعالجتها\n` +
  `5️⃣ تحديث السيرفر من GitHub وإعادة التشغيل\n` +
  `6️⃣ إعادة تشغيل البوت فقط (PM2)`;

// ━━━ معالجة خيارات وأوامر الإدارة ChatOps ━━━
async function handleAdminMessage(sock, from, rawText) {
  const text = (rawText || "").trim();
  // تنظيف النص لمعرفة الخيار (مثال: "-حالة" -> "حالة" أو "1")
  const cleanCmd = text.replace(/^[-/]\s*/, "").trim();

  // خيار 1: حالة السيرفر
  if (text === "1" || cleanCmd === "حالة" || cleanCmd === "status") {
    const metrics = await getBatteryAndDeviceMetrics();
    const uptimeSec = Math.floor(process.uptime());
    const uptimeStr = formatUptimeSmart(uptimeSec);

    const batteryDisplay = metrics.percentage
      ? `${metrics.percentage} (${metrics.chargerText})`
      : metrics.chargerText;

    const tempDisplay = metrics.tempText || "حرارة طبيعية";

    const statusMsg =
      `📊 *حالة سيرفر شقق العلا*\n` +
      `• *البطارية:* ${batteryDisplay}\n` +
      `• *حرارة الجهاز:* ${tempDisplay}\n` +
      `• *حالة السيرفر:* متصل ويعمل بكفاءة ✅\n` +
      `• *مدة العمل المتواصل:* ${uptimeStr}`;

    await sendToAdmin(sock, from, { text: statusMsg });
    return;
  }

  // خيار 2: ملخص اليوم
  if (text === "2" || cleanCmd === "اليوم" || cleanCmd === "today") {
    try {
      await sendToAdmin(sock, from, { text: "⏳ جارٍ جلب التقرير اليومي من قاعدة البيانات..." });
      const reportText = await convex.query("analytics:getDailyAdminReportText", {});
      await sendToAdmin(sock, from, { text: reportText });
    } catch (err) {
      await sendToAdmin(sock, from, { text: `❌ تعذر جلب التقرير اليومي: ${err.message}` });
    }
    return;
  }

  // خيار 3: الإحصائيات الشهرية
  if (text === "3" || cleanCmd === "الشهر" || cleanCmd === "month") {
    try {
      await sendToAdmin(sock, from, { text: "⏳ جارٍ استخراج الإحصائيات الشهرية وإجمالي الإيرادات..." });
      const monthReportText = await convex.query("analytics:getMonthlyAdminReportText", {});
      await sendToAdmin(sock, from, { text: monthReportText });
    } catch (err) {
      await sendToAdmin(sock, from, { text: `❌ تعذر جلب إحصائيات الشهر: ${err.message}` });
    }
    return;
  }

  // خيار 4: البلاغات المفتوحة
  if (text === "4" || cleanCmd === "بلاغات" || cleanCmd === "reports") {
    try {
      const reports = await convex.query("reports:getLatestOpenReports", { limit: 5 });
      if (!reports || reports.length === 0) {
        await sendToAdmin(sock, from, {
          text: "✅ لا توجد أي بلاغات معلقة حالياً. المنصة تعمل بسلاسة وبدون شكاوى!",
        });
        return;
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
      await sendToAdmin(sock, from, { text: repMsg });
    } catch (err) {
      await sendToAdmin(sock, from, { text: `❌ تعذر جلب البلاغات: ${err.message}` });
    }
    return;
  }

  // خيار 5: تحديث السيرفر من GitHub
  if (text === "5" || cleanCmd === "تحديث" || cleanCmd === "update") {
    await sendToAdmin(sock, from, {
      text: "⏳ جاري سحب آخر التحديثات من GitHub وتثبيت التبعيات وإعادة تشغيل البوت...",
    });

    const updateCommand = "git pull && npm install && pm2 restart whatsapp-bot";

    exec(updateCommand, async (err, stdout, stderr) => {
      if (err) {
        console.error("❌ فشل أمر التحديث /تحديث:", err);
        const errMsg =
          `❌ *فشل التحديث التلقائي عبر Git*:\n\n` +
          `\`\`\`\n${(err.message || stderr || "خطأ غير معروف").slice(0, 300)}\n\`\`\`\n` +
          `يرجى التحقق من المستودع على الجوال يدوياً.`;
        await sendToAdmin(sock, from, { text: errMsg });
      } else {
        console.log("✅ تم التحديث بنجاح:", stdout);
      }
    });
    return;
  }

  // خيار 6: إعادة تشغيل البوت فقط
  if (text === "6" || cleanCmd === "إعادة" || cleanCmd === "restart") {
    await sendToAdmin(sock, from, { text: "🔁 جاري إعادة تشغيل بوت شقق العلا عبر PM2..." });
    setTimeout(() => {
      exec("pm2 restart whatsapp-bot", (err) => {
        if (err) {
          console.error("فشل أمر pm2 restart:", err);
          process.exit(1);
        }
      });
    }, 1500);
    return;
  }

  // إذا كتب الأدمن أي نص آخر، أرسل له لوحة تحكم الإدارة فوراً
  await sendToAdmin(sock, from, { text: ADMIN_MENU_TEXT });
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
      isWaConnected = true;
      disconnectedSince = 0;
      consecutiveDisconnects = 0;
      setupRealtimeSubscription(sock);
      checkServerHealth(sock);
      setInterval(() => checkServerHealth(sock), 15 * 60 * 1000);
    }

    if (connection === "close") {
      isWaConnected = false;
      currentSock = null;
      if (!disconnectedSince) {
        disconnectedSince = Date.now();
      }
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      consecutiveDisconnects++;

      console.log(
        `⚠️ انقطع الاتصال (السبب: ${reason} | المحاولة: ${consecutiveDisconnects}). ${
          shouldReconnect ? "إعادة الاتصال..." : "تم تسجيل الخروج."
        }`
      );

      if (!shouldReconnect) {
        console.error("❌ تم تسجيل الخروج من جلسة الواتساب. يلزم إعادة مسح رمز QR.");
        return;
      }

      // إذا فشلت 4 محاولات متتالية، إنهاء العملية ليتولى PM2 إعادة تشغيل نظيفة
      if (consecutiveDisconnects >= 4) {
        console.warn("⚠️ فشلت 4 محاولات اتصال متتالية. إعادة تشغيل العملية عبر PM2...");
        process.exit(1);
      }

      // تأخير متدرج: 5ث، ثم 10ث، ثم 15ث
      const delayMs = Math.min(consecutiveDisconnects * 5000, 15000);
      console.log(`⏳ سيتم محاولة إعادة الاتصال بعد ${delayMs / 1000} ثوانٍ...`);
      setTimeout(startBot, delayMs);
    }
  });

  // ━━━ استقبال ومعالجة الرسائل الواردة ━━━
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      if (!from) continue;
      if (!from.endsWith("@s.whatsapp.net") && !from.endsWith("@lid")) continue;

      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""
      ).trim();

      if (!text) continue;

      // 1. التحقق القطعي 100% من الأدمن
      const isAdmin = isAdminSender(msg);
      console.log(`📩 رسالة من [${from}] | أدمن: ${isAdmin ? "👑 نعم" : "👤 عميل"} | المحتوى: "${text}"`);

      // إذا كان المرسل هو الأدمن: تحويل مباشر للوحة تحكم الإدارة ويُمنع منعاً باتاً وصوله لمنطق العملاء
      if (isAdmin) {
        await handleAdminMessage(sock, from, text);
        continue;
      }

      // ━━━ منطق العملاء والملاك العاديين حصراً ━━━
      const cleanPhone = from.replace(/@(s\.whatsapp\.net|lid)/g, "").replace(/\D/g, "");

      // 2. إذا كانت الرسالة رقماً (1 إلى 5)
      const num = Number(text);
      if (!isNaN(num) && num >= 1 && num <= 5) {
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
          // ليس رداً على حجز، ننتقل لخيارات القائمة الترحيبية للعملاء
        }

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

      // 3. رسائل العملاء العادية: إرسال القائمة الترحيبية مع Cooldown ساعتين
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

// ━━━ نظام الاشتراك الفوري (Real-time Subscription) وتوفير البطارية ━━━
let currentSock = null;
let isQueueProcessing = false;
let isRealtimeSubscribed = false;

async function handlePendingMessages(pending, sock = currentSock) {
  if (!sock || !isWaConnected || !pending || pending.length === 0) return;
  if (isQueueProcessing) return;
  isQueueProcessing = true;
  lastSuccessfulPoll = Date.now();

  try {
    for (const item of pending) {
      try {
        const cleanPhone = (item.ownerPhone || "").replace(/\D/g, "");
        if (!cleanPhone) continue;
        const jid = cleanPhone + "@s.whatsapp.net";

        // إرسال الرسالة مع timeout لمنع تعليق الدورة في حال بطء الشبكة
        await Promise.race([
          sock.sendMessage(jid, { text: item.message }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout sending WhatsApp message")), 10000)
          ),
        ]);

        await convex.mutation("whatsapp:markMessageSent", { id: item._id });
        console.log(`📤 تم إرسال رسالة [${item.type || "عامة"}] إلى ${item.ownerPhone} بنجاح ✅`);
      } catch (err) {
        console.error(`❌ فشل إرسال رسالة إلى ${item.ownerPhone}:`, err.message);
        await convex
          .mutation("whatsapp:markMessageFailed", {
            id: item._id,
            error: err.message,
          })
          .catch(() => {});
      }
    }
  } catch (err) {
    console.error("❌ خطأ أثناء معالجة رسائل طابور Convex:", err.message);
  } finally {
    isQueueProcessing = false;
  }
}

function setupRealtimeSubscription(sock) {
  currentSock = sock;
  if (isRealtimeSubscribed) return;
  isRealtimeSubscribed = true;

  console.log("⚡ تفعيل الاشتراك الفوري (Real-time Subscription) مع Convex لحفظ بطارية السيرفر...");

  // 1. الاشتراك اللحظي: يستيقظ البوت فوراً عند إضافة أي رسالة جديدة في whatsappQueue
  convexRealtime.onUpdate(api.whatsapp.getPendingMessages, {}, async (messages) => {
    lastSuccessfulPoll = Date.now();
    if (messages && messages.length > 0) {
      console.log(`⚡ وصل إشعار لحظي بوجود (${messages.length}) رسالة جديدة في الطابور!`);
      await handlePendingMessages(messages, currentSock);
    }
  });

  // 2. فحص احتياطي صامت كل 60 ثانية فقط كأمان إضافي في حال انقطاع الـ WebSocket مؤقتاً
  setInterval(async () => {
    if (!isWaConnected || !currentSock) return;
    try {
      const fallbackPending = await convex.query("whatsapp:getPendingMessages", {});
      lastSuccessfulPoll = Date.now();
      if (fallbackPending && fallbackPending.length > 0) {
        await handlePendingMessages(fallbackPending, currentSock);
      }
    } catch {
      // فحص احتياطي صامت
    }
  }, 60 * 1000);
}

// ━━━ فحص وجود إنترنت فعلي عبر DNS ━━━
function checkInternetConnectivity() {
  return new Promise((resolve) => {
    dns.lookup("web.whatsapp.com", (err) => {
      resolve(!err);
    });
  });
}

// ━━━ حارس الشبكة والتجمّد الذاتي (Self-Healing Watchdog كل 30 ثانية) ━━━
function startNetworkWatchdog() {
  const TWO_MINUTES_MS = 2 * 60 * 1000;
  const THREE_MINUTES_MS = 3 * 60 * 1000;

  setInterval(async () => {
    const isOnline = await checkInternetConnectivity();
    const now = Date.now();

    if (!isOnline) {
      if (!wasOffline) {
        console.warn("⚠️ [Watchdog] تم رصد انقطاع الاتصال بالإنترنت.");
        wasOffline = true;
      }
      return;
    }

    // الإنترنت متوفر الآن:
    // 1. فور عودة الإنترنت بعد انقطاع: إعادة تشغيل فورية ونظيفة عبر PM2
    if (wasOffline) {
      console.warn("🌐 [Watchdog] عادت شبكة الإنترنت بعد انقطاع! إعادة تشغيل البوت فوراً عبر PM2 لإنشاء اتصال نظيف...");
      wasOffline = false;
      process.exit(1);
    }

    // 2. إذا ظل واتساب غير متصل لأكثر من دقيقتين مع وجود إنترنت:
    if (!isWaConnected) {
      if (!disconnectedSince) {
        disconnectedSince = now;
      } else if (now - disconnectedSince > TWO_MINUTES_MS) {
        console.warn(
          `⚠️ [Watchdog] واتساب غير متصل منذ ${Math.round((now - disconnectedSince) / 1000)} ثانية رغم توفر الإنترنت. إعادة التشغيل عبر PM2...`
        );
        process.exit(1);
      }
    }

    // 3. إذا لم ينجح فحص طابور Convex لأكثر من 3 دقائق مع وجود إنترنت (مؤشر تجمّد العملية):
    if (now - lastSuccessfulPoll > THREE_MINUTES_MS) {
      console.warn(
        `⚠️ [Watchdog] توقف فحص طابور Convex منذ ${Math.round((now - lastSuccessfulPoll) / 1000)} ثانية (تجمّد محتمل). إعادة التشغيل عبر PM2...`
      );
      process.exit(1);
    }
  }, 30 * 1000);
}

// ━━━ بدء التشغيل ━━━
console.log("🚀 بدء تشغيل نظام بوت الواتساب والمراقبة لمنصة شقق العلا...");
startNetworkWatchdog();
startBot();
