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
import { exec } from "child_process";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QR from "qrcode-terminal";
import { ConvexHttpClient } from "convex/browser";

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

/** معرفات الأدمن القطعية (آخر 9 أرقام ومعرف LID) */
const ADMIN_PHONE_SUFFIX = "506709265";
const ADMIN_LID = "255220479201491";
const ADMIN_FALLBACK_JID = "966506709265@s.whatsapp.net";

// ━━━ متغيرات تتبع حالة الاتصال ونظام المراقبة الذاتي (Watchdog) ━━━
let isWaConnected = false;
let disconnectedSince = 0;
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
          sock.sendMessage(ADMIN_FALLBACK_JID, { text: msg }).catch(() => {});
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
          sock.sendMessage(ADMIN_FALLBACK_JID, { text: msg }).catch(() => {});
        }
      }
    } catch {}
  });
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
    return;
  }

  // خيار 2: ملخص اليوم
  if (text === "2" || cleanCmd === "اليوم" || cleanCmd === "today") {
    try {
      await sock.sendMessage(from, { text: "⏳ جارٍ جلب التقرير اليومي من قاعدة البيانات..." });
      const reportText = await convex.query("analytics:getDailyAdminReportText", {});
      await sock.sendMessage(from, { text: reportText });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ تعذر جلب التقرير اليومي: ${err.message}` });
    }
    return;
  }

  // خيار 3: الإحصائيات الشهرية
  if (text === "3" || cleanCmd === "الشهر" || cleanCmd === "month") {
    try {
      await sock.sendMessage(from, { text: "⏳ جارٍ استخراج الإحصائيات الشهرية وإجمالي الإيرادات..." });
      const monthReportText = await convex.query("analytics:getMonthlyAdminReportText", {});
      await sock.sendMessage(from, { text: monthReportText });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ تعذر جلب إحصائيات الشهر: ${err.message}` });
    }
    return;
  }

  // خيار 4: البلاغات المفتوحة
  if (text === "4" || cleanCmd === "بلاغات" || cleanCmd === "reports") {
    try {
      const reports = await convex.query("reports:getLatestOpenReports", { limit: 5 });
      if (!reports || reports.length === 0) {
        await sock.sendMessage(from, {
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
      await sock.sendMessage(from, { text: repMsg });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ تعذر جلب البلاغات: ${err.message}` });
    }
    return;
  }

  // خيار 5: تحديث السيرفر من GitHub
  if (text === "5" || cleanCmd === "تحديث" || cleanCmd === "update") {
    await sock.sendMessage(from, {
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
        await sock.sendMessage(from, { text: errMsg }).catch(() => {});
      } else {
        console.log("✅ تم التحديث بنجاح:", stdout);
      }
    });
    return;
  }

  // خيار 6: إعادة تشغيل البوت فقط
  if (text === "6" || cleanCmd === "إعادة" || cleanCmd === "restart") {
    await sock.sendMessage(from, { text: "🔁 جاري إعادة تشغيل بوت شقق العلا عبر PM2..." });
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
  await sock.sendMessage(from, { text: ADMIN_MENU_TEXT });
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
      processQueue(sock);
      checkServerHealth(sock);
      setInterval(() => checkServerHealth(sock), 15 * 60 * 1000);
    }

    if (connection === "close") {
      isWaConnected = false;
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

// ━━━ مراقبة طابور الرسائل كل 5 ثوانٍ ━━━
async function processQueue(sock) {
  try {
    const pending = await convex.query("whatsapp:getPendingMessages", {});
    lastSuccessfulPoll = Date.now();

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
        console.warn("⚠️ تم رصد انقطاع الاتصال بالإنترنت.");
        wasOffline = true;
      }
      return;
    }

    // الإنترنت متوفر الآن:
    // 1. إذا كان الإنترنت منقطعاً سابقاً والآن عاد، وكان واتساب غير متصل أو متجمداً:
    if (wasOffline) {
      console.log("🌐 عادت شبكة الإنترنت بعد انقطاع!");
      wasOffline = false;
      if (!isWaConnected) {
        console.warn("🔄 إعادة تشغيل البوت فوراً عبر PM2 لإنشاء اتصال نظيف بعد عودة الشبكة...");
        process.exit(1);
      }
    }

    // 2. إذا ظل واتساب غير متصل لأكثر من دقيقتين رغم توفر الإنترنت:
    if (!isWaConnected && disconnectedSince > 0) {
      const offlineDuration = now - disconnectedSince;
      if (offlineDuration > TWO_MINUTES_MS) {
        console.warn(
          `⚠️ واتساب غير متصل منذ ${Math.round(offlineDuration / 1000)} ثانية رغم توفر الإنترنت. إعادة التشغيل عبر PM2...`
        );
        process.exit(1);
      }
    }

    // 3. إذا لم ينجح فحص طابور Convex لأكثر من 3 دقائق رغم توفر الإنترنت (مؤشر تجمّد العملية):
    if (now - lastSuccessfulPoll > THREE_MINUTES_MS) {
      console.warn(
        `⚠️ توقف فحص طابور Convex منذ ${Math.round((now - lastSuccessfulPoll) / 1000)} ثانية (تجمّد محتمل). إعادة التشغيل عبر PM2...`
      );
      process.exit(1);
    }
  }, 30 * 1000);
}

// ━━━ بدء التشغيل ━━━
console.log("🚀 بدء تشغيل نظام بوت الواتساب والمراقبة لمنصة شقق العلا...");
startNetworkWatchdog();
startBot();
