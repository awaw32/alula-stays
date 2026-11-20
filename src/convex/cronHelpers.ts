"use node";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * دالة داخلية يستدعيها الـ cron يومياً.
 * تجلب جميع الملاك المفعّلين وتُدرج رسالة تذكير بحالة "pending"
 * في جدول whatsappQueue ليلتقطها بوت الواتساب.
 */
export const sendDailyOwnerReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const allOwners: any[] = await ctx.runQuery(internal.cronQueries.getAllOwners, {});

    for (const owner of allOwners) {
      if (!owner.phone) continue;

      // تنسيق الرقم بصيغة دولية
      let phone = owner.phone.replace(/\D/g, "");
      if (phone.startsWith("05") && phone.length === 10) {
        phone = "966" + phone.slice(1);
      } else if (!phone.startsWith("966")) {
        phone = "966" + phone;
      }

      // جلب شقق المالك
      const apartments: any[] = await ctx.runQuery(internal.cronQueries.getOwnerApartments, {
        ownerId: owner._id,
      });

      if (apartments.length === 0) continue;

      // بناء رسالة التذكير
      let msg = `صباح الخير 🌞\nهذا تذكيرك اليومي من شقق العلا:\n\n`;
      for (const apt of apartments) {
        const status = apt.available !== false ? "✅ متاحة" : "❌ غير متاحة";
        msg += `🏠 ${apt.title}: ${status}\n`;
      }
      msg += `\nللتحديث، الرجاء الرد:\n1️⃣ = جميع شققي متاحة اليوم\n2️⃣ = لدي شقة محجوزة خارجياً`;

      // إدراج الرسالة في الطابور بحالة "pending"
      await ctx.runMutation(internal.whatsapp.enqueueMessage, {
        ownerId: owner._id,
        ownerPhone: phone,
        message: msg,
        type: "daily_check",
      });
    }
  },
});
