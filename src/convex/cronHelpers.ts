"use node";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const ADMIN_PHONE = "966506709265";

/**
 * تذكير يومي للملاك عبر واتساب (الساعة 10:00 صباحاً بتوقيت السعودية).
 */
export const sendDailyOwnerReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const allOwners: any[] = await ctx.runQuery(internal.cronQueries.getAllOwners, {});

    for (const owner of allOwners) {
      if (!owner.phone) continue;

      let phone = owner.phone.replace(/\D/g, "");
      if (phone.startsWith("05") && phone.length === 10) {
        phone = "966" + phone.slice(1);
      } else if (!phone.startsWith("966")) {
        phone = "966" + phone;
      }

      const apartments: any[] = await ctx.runQuery(internal.cronQueries.getOwnerApartments, {
        ownerId: owner._id,
      });

      if (apartments.length === 0) continue;

      let msg = `صباح الخير 🌞\nهذا تذكيرك اليومي من شقق العلا:\n\n`;
      for (const apt of apartments) {
        const status = apt.available !== false ? "✅ متاحة" : "❌ غير متاحة";
        msg += `🏠 ${apt.title}: ${status}\n`;
      }
      msg += `\nللتحديث، الرجاء الرد:\n1️⃣ = جميع شققي متاحة اليوم\n2️⃣ = لدي شقة محجوزة خارجياً`;

      await ctx.runMutation(internal.whatsapp.enqueueMessage, {
        ownerId: owner._id,
        ownerPhone: phone,
        message: msg,
        type: "daily_check",
      });
    }
  },
});

/**
 * إرسال التقرير اليومي المختصر لرقم الإدارة (الساعة 11:00 مساءً بتوقيت السعودية / 20:00 UTC).
 */
export const sendDailyAdminSummary = internalAction({
  args: {},
  handler: async (ctx) => {
    const reportText = await ctx.runQuery(api.analytics.getDailyAdminReportText, {});

    await ctx.runMutation(internal.whatsapp.enqueueMessage, {
      ownerPhone: ADMIN_PHONE,
      message: reportText,
      type: "daily_report",
    });
  },
});

/**
 * استعادة الدفع المتروك: تفحص كل 30 دقيقة من وصل للدفع ولم يكمل الحجز وترسل له رسالة مساعدة.
 */
export const recoverAbandonedCheckouts = internalAction({
  args: {},
  handler: async (ctx) => {
    const abandoned: any[] = await ctx.runQuery(internal.cronQueries.getAbandonedCheckouts, {});

    for (const item of abandoned) {
      const nameGreeting = item.guestName ? ` ${item.guestName}` : "";
      const msg =
        `مرحباً بك عزيزنا الضيف${nameGreeting} من منصة شقق العلا 🌿✨\n\n` +
        `لاحظنا اهتمامك بحجز "${item.apartmentTitle}" ولم تستكمل خطوات الدفع.\n\n` +
        `هل واجهتك أي صعوبة في الدفع أو لديك أي استفسار حول الشقة والتواريخ؟\n\n` +
        `يسعدنا دائماً خدمتك ومساعدتك لإتمام حجزك في أي وقت:\n` +
        `🔗 https://alulahome.com/my-bookings\n\n` +
        `أو يمكنك الرد على هذه الرسالة وسيقوم فريقنا بمساعدتك فوراً! 🌴`;

      await ctx.runMutation(internal.whatsapp.enqueueMessage, {
        bookingId: item.bookingId,
        ownerPhone: item.phone,
        message: msg,
        type: "abandoned_checkout",
      });

      await ctx.runMutation(internal.cronQueries.markAbandonedReminderSent, {
        bookingId: item.bookingId,
        analyticsId: item.analyticsId,
      });
    }
  },
});

/**
 * إرسال دليل تسجيل الدخول للنزيل (قبل الدخول بساعتين للحجوزات المؤكدة والمدفوعة).
 */
export const sendCheckInGuides = internalAction({
  args: {},
  handler: async (ctx) => {
    const upcoming: any[] = await ctx.runQuery(internal.cronQueries.getUpcomingCheckIns, {});

    for (const item of upcoming) {
      const msg =
        `🌴 *أهلاً بك في العلا! دليل تسجيل الدخول*\n\n` +
        `عزيزنا الضيف ${item.guestName}، يسعدنا استقبالك اليوم في:\n` +
        `🏠 *${item.apartmentTitle}*\n` +
        `📍 *الموقع:* ${item.location}\n` +
        `🕒 *وقت تسجيل الدخول:* ${item.checkInTime}\n` +
        `🔑 *طريقة الدخول:* الدخول ذاتي / أو التواصل مع المضيف عند الوصول.\n\n` +
        `للاطلاع على تفاصيل الحجز والموقع الدقيق:\n` +
        `🔗 https://alulahome.com/my-bookings?booking=${item.bookingId}\n\n` +
        `فريق شقق العلا يتمنى لك إقامة هانئة وتجربة لا تُنسى! ✨`;

      await ctx.runMutation(internal.whatsapp.enqueueMessage, {
        bookingId: item.bookingId,
        apartmentId: item.apartmentId,
        ownerPhone: item.phone,
        message: msg,
        type: "checkin_guide",
      });

      await ctx.runMutation(internal.cronQueries.markCheckInGuideSent, {
        bookingId: item.bookingId,
      });
    }
  },
});

/**
 * إرسال طلب التقييم التلقائي للنزيل (بعد وقت المغادرة بساعتين).
 */
export const sendReviewPrompts = internalAction({
  args: {},
  handler: async (ctx) => {
    const completed: any[] = await ctx.runQuery(internal.cronQueries.getCompletedBookingsForReview, {});

    for (const item of completed) {
      const msg =
        `🌿 *شكراً لإقامتك في شقق العلا*\n\n` +
        `عزيزنا الضيف ${item.guestName}، نأمل أن تكون إقامتك في "${item.apartmentTitle}" كانت مريحة ومميزة ✨\n\n` +
        `فضلاً شاركنا تقييمك لتجربتك بالرد على هذه الرسالة برقم من 1 إلى 5:\n` +
        `5️⃣ = ممتاز جداً ⭐⭐⭐⭐⭐\n` +
        `4️⃣ = جيد جداً ⭐⭐⭐⭐\n` +
        `3️⃣ = جيد ⭐⭐⭐\n` +
        `2️⃣ = مقبول ⭐⭐\n` +
        `1️⃣ = غير مرضي ⭐\n\n` +
        `رأيك يصنع الفرق ويساعدنا في تطوير خدماتنا دائماً! 🌴`;

      await ctx.runMutation(internal.whatsapp.enqueueMessage, {
        bookingId: item.bookingId,
        apartmentId: item.apartmentId,
        ownerPhone: item.phone,
        message: msg,
        type: "review_request",
      });

      await ctx.runMutation(internal.cronQueries.markReviewPromptSent, {
        bookingId: item.bookingId,
      });
    }
  },
});

/**
 * مراقبة تأخر الملاك في قبول أو رفض الحجوزات المعلقة:
 * - بعد ساعتين: تنبيه عاجل للمالك وتنبيه للأدمن.
 * - بعد 24 ساعة: إلغاء تلقائي للطلب وإشعار الضيف والأدمن.
 */
export const checkPendingBookingsTimeout = internalAction({
  args: {},
  handler: async (ctx) => {
    // 1. تنبيه الملاك المتأخرين (أكثر من ساعتين)
    const delayed: any[] = await ctx.runQuery(internal.cronQueries.getDelayedHostBookings, {});
    for (const item of delayed) {
      if (item.ownerPhone) {
        const ownerAlertMsg =
          `⚠️ *تذكير عاجل من شقق العلا*\n\n` +
          `عزيزنا المستضيف، لديك طلب حجز معلق لشقة "*${item.apartmentTitle}*" من الضيف ${item.guestName} (فاتورة #${item.invoiceNumber}) منذ أكثر من ساعتين بانتظار قرارك.\n\n` +
          `الرجاء الرد السريع على هذه الرسالة:\n` +
          `1️⃣ للموافقة على الحجز ✅\n` +
          `2️⃣ للاعتذار عن الحجز ❌\n\n` +
          `سرعة تجاوبك ترفع تقييمك وتضمن استمرار حجز الضيف 🌴✨`;

        await ctx.runMutation(internal.whatsapp.enqueueMessage, {
          bookingId: item.bookingId,
          apartmentId: item.apartmentId,
          ownerPhone: item.ownerPhone,
          message: ownerAlertMsg,
          type: "booking_request",
        });
      }

      // تنبيه للأدمن بتأخر المالك
      const adminDelayMsg =
        `⏳ *تنبيه رقابي: تأخر مضيف في الرد على حجز*\n\n` +
        `🏠 *الشقة:* ${item.apartmentTitle}\n` +
        `👤 *المستضيف:* ${item.ownerName} (${item.ownerPhone || "بدون هاتف"})\n` +
        `🧾 *الفاتورة:* #${item.invoiceNumber}\n` +
        `⚠️ الطلب معلق منذ أكثر من ساعتين دون موافقة أو رفض.\n` +
        `🔗 https://alulahome.com/admin`;

      await ctx.runMutation(internal.whatsapp.enqueueMessage, {
        ownerPhone: ADMIN_PHONE,
        message: adminDelayMsg,
        type: "general",
      });

      await ctx.runMutation(internal.cronQueries.markHostDelayAlertSent, {
        bookingId: item.bookingId,
      });
    }

    // 2. إلغاء الطلبات المتأخرة أكثر من 24 ساعة تلقائياً
    const expired: any[] = await ctx.runQuery(internal.cronQueries.getExpiredUnansweredBookings, {});
    for (const item of expired) {
      await ctx.runMutation(internal.cronQueries.autoCancelExpiredBooking, {
        bookingId: item.bookingId,
      });

      // إشعار الضيف بلطف
      if (item.guestPhone) {
        const guestExpireMsg =
          `عزيزنا الضيف ${item.guestName} 🙏\n\n` +
          `نعتذر منك، لقد تعذر الحصول على تأكيد من مالك شقة "*${item.apartmentTitle}*" خلال مهلة الـ 24 ساعة، وتم إلغاء الطلب تلقائياً.\n\n` +
          `يسعدنا جداً مساعدتك في اختيار وحدة بديلة وممتازة في العلا عبر الرابط:\n` +
          `🔗 https://alulahome.com/apartments\n\n` +
          `فريق شقق العلا دائماً في خدمتك! 🌴✨`;

        await ctx.runMutation(internal.whatsapp.enqueueMessage, {
          bookingId: item.bookingId,
          apartmentId: item.apartmentId,
          ownerPhone: item.guestPhone,
          message: guestExpireMsg,
          type: "booking_update",
        });
      }

      // إشعار الأدمن بالإلغاء التلقائي
      const adminExpireMsg =
        `🛑 *إلغاء تلقائي لحجز معلق تجاوز 24 ساعة*\n\n` +
        `الشقة: ${item.apartmentTitle}\n` +
        `الفاتورة: #${item.invoiceNumber}\n` +
        `تم إلغاء الحجز وإشعار الضيف وإتاحة التواريخ مجدداً.`;

      await ctx.runMutation(internal.whatsapp.enqueueMessage, {
        ownerPhone: ADMIN_PHONE,
        message: adminExpireMsg,
        type: "general",
      });
    }
  },
});
