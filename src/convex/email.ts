/**
 * نظام البريد الإلكتروني والإشعارات
 * إرسال رسائل بريد وإشعارات للمستخدمين
 */

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * قالب البريد الإلكتروني للتأكيد
 */
function getConfirmationEmailTemplate(userName: string, bookingId: string): string {
  return `
    <h2>تم تأكيد حجزك بنجاح! 🎉</h2>
    <p>مرحباً ${userName}،</p>
    <p>شكراً لحجزك معنا!</p>
    <p><strong>رقم الحجز:</strong> ${bookingId}</p>
    <p>يمكنك عرض تفاصيل حجزك من خلال حسابك في التطبيق.</p>
    <p>نتطلع لاستقبالك! 🏠</p>
  `;
}

/**
 * قالب البريد الإلكتروني لإعادة تعيين كلمة المرور
 */
function getResetPasswordTemplate(resetLink: string): string {
  return `
    <h2>إعادة تعيين كلمة المرور</h2>
    <p>تلقينا طلب لإعادة تعيين كلمة المرور.</p>
    <p><a href="${resetLink}">انقر هنا لإعادة تعيين كلمة المرور</a></p>
    <p>إذا لم تطلب هذا، تجاهل هذا البريد.</p>
  `;
}

/**
 * قالب البريد الإلكتروني لتأكيد البريد
 */
function getVerificationEmailTemplate(verificationLink: string): string {
  return `
    <h2>تأكيد بريدك الإلكتروني</h2>
    <p>شكراً للتسجيل معنا!</p>
    <p><a href="${verificationLink}">انقر هنا لتأكيد بريدك</a></p>
    <p>أو انسخ هذا الرابط في متصفحك:</p>
    <p>${verificationLink}</p>
  `;
}

/**
 * قالب الإشعار للمالك - حجز جديد
 */
function getNewBookingNotificationTemplate(
  bookingId: string,
  apartmentName: string,
  guestName: string,
  checkInDate: string
): string {
  return `
    <h2>حجز جديد! 🎊</h2>
    <p>لديك حجز جديد على شقتك!</p>
    <ul>
      <li><strong>الشقة:</strong> ${apartmentName}</li>
      <li><strong>الضيف:</strong> ${guestName}</li>
      <li><strong>تاريخ الوصول:</strong> ${checkInDate}</li>
      <li><strong>رقم الحجز:</strong> ${bookingId}</li>
    </ul>
    <p>تحقق من لوحة تحكمك للمزيد من التفاصيل.</p>
  `;
}

/**
 * قالب الإشعار للضيف - تأكيد الحجز
 */
function getBookingConfirmedNotificationTemplate(
  apartmentName: string,
  checkInDate: string,
  checkOutDate: string
): string {
  return `
    <h2>تم تأكيد حجزك! ✅</h2>
    <p>تم تأكيد حجزك بنجاح!</p>
    <ul>
      <li><strong>الشقة:</strong> ${apartmentName}</li>
      <li><strong>تاريخ الوصول:</strong> ${checkInDate}</li>
      <li><strong>تاريخ المغادرة:</strong> ${checkOutDate}</li>
    </ul>
    <p>نتطلع لاستقبالك! 🏠</p>
  `;
}

/**
 * إرسال بريد إلكتروني
 * ملاحظة: يجب ربط خدمة بريد فعلية (مثل SendGrid أو Mailgun)
 */
export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    type: v.union(
      v.literal("confirmation"),
      v.literal("reset-password"),
      v.literal("verification"),
      v.literal("booking-notification"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    try {
      // في بيئة الإنتاج، استخدم خدمة بريد حقيقية
      // مثال: const response = await fetch('https://api.sendgrid.com/v3/mail/send', {...})

      console.log(`📧 محاولة إرسال بريد:`);
      console.log(`   إلى: ${args.to}`);
      console.log(`   الموضوع: ${args.subject}`);
      console.log(`   النوع: ${args.type}`);

      // محاكاة الإرسال الناجح
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ خطأ في إرسال البريد:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * إرسال إشعار بريد التأكيد
 */
export const sendVerificationEmail = internalAction({
  args: {
    email: v.string(),
    userName: v.string(),
    verificationToken: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const verificationLink = `${process.env.SITE_URL}/verify-email?token=${args.verificationToken}`;
    const htmlContent = getVerificationEmailTemplate(verificationLink);

    return await ctx.runAction(internal.email.sendEmail, {
      to: args.email,
      subject: "تأكيد بريدك الإلكتروني",
      htmlContent,
      type: "verification",
    });
  },
});

/**
 * إرسال إشعار تأكيد الحجز
 */
export const sendBookingConfirmation = internalAction({
  args: {
    email: v.string(),
    userName: v.string(),
    bookingId: v.string(),
    apartmentName: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const htmlContent = getConfirmationEmailTemplate(args.userName, args.bookingId);

    return await ctx.runAction(internal.email.sendEmail, {
      to: args.email,
      subject: `تم تأكيد حجزك - ${args.apartmentName}`,
      htmlContent,
      type: "confirmation",
    });
  },
});

/**
 * إرسال إشعار للمالك عند وجود حجز جديد
 */
export const sendNewBookingNotification = internalAction({
  args: {
    ownerEmail: v.string(),
    bookingId: v.string(),
    apartmentName: v.string(),
    guestName: v.string(),
    checkInDate: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const htmlContent = getNewBookingNotificationTemplate(
      args.bookingId,
      args.apartmentName,
      args.guestName,
      args.checkInDate
    );

    return await ctx.runAction(internal.email.sendEmail, {
      to: args.ownerEmail,
      subject: `حجز جديد على ${args.apartmentName}! 🎊`,
      htmlContent,
      type: "booking-notification",
    });
  },
});
