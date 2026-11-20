import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * 1. تذكير يومي للملاك عبر واتساب (الساعة 10:00 صباحاً بتوقيت السعودية / 07:00 UTC).
 */
crons.cron(
  "daily owner whatsapp reminder",
  "0 7 * * *",
  internal.cronHelpers.sendDailyOwnerReminders,
);

/**
 * 2. تقرير الإدارة اليومي المختصر عبر واتساب (الساعة 11:00 مساءً بتوقيت السعودية / 20:00 UTC).
 */
crons.cron(
  "daily admin whatsapp summary",
  "0 20 * * *",
  internal.cronHelpers.sendDailyAdminSummary,
);

/**
 * 3. استعادة الدفع المتروك: فحص كل 30 دقيقة وإرسال رسائل مساعدة للنزلاء.
 */
crons.cron(
  "recover abandoned checkouts",
  "*/30 * * * *",
  internal.cronHelpers.recoverAbandonedCheckouts,
);

/**
 * 4. دليل تسجيل الدخول: إرسال تعليمات الوصول قبل موعد الدخول بساعتين.
 */
crons.cron(
  "send checkin guides",
  "*/30 * * * *",
  internal.cronHelpers.sendCheckInGuides,
);

/**
 * 5. التقييم التلقائي: إرسال طلب التقييم للنزيل بعد المغادرة بساعتين.
 */
crons.cron(
  "send review prompts",
  "*/30 * * * *",
  internal.cronHelpers.sendReviewPrompts,
);

/**
 * 6. مراقبة تأخر الملاك في الرد على الحجوزات: تذكير بعد ساعتين وإلغاء تلقائي بعد 24 ساعة.
 */
crons.cron(
  "check pending bookings timeout",
  "0 * * * *",
  internal.cronHelpers.checkPendingBookingsTimeout,
);

export default crons;
