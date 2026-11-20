import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * تذكير يومي للملاك عبر واتساب.
 * يُنفّذ كل يوم في الساعة 07:00 UTC (10:00 ص بتوقيت السعودية).
 *
 * المنطق:
 * 1. يجلب جميع المستخدمين بدور "owner" الذين لديهم رقم هاتف.
 * 2. يجلب شققهم ويبني رسالة تذكيرية.
 * 3. يُدرج رسالة جديدة بحالة "pending" في whatsappQueue.
 * 4. بوت الواتساب (Termux) يلتقطها ويرسلها فعلياً.
 */
crons.cron(
  "daily owner whatsapp reminder",
  "0 7 * * *",
  internal.cronHelpers.sendDailyOwnerReminders,
);

export default crons;
