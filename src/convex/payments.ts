"use node";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";
import {
  validateApiKey,
  validateUrl,
} from "./lib/validation";
import {
  ERROR_MESSAGES,
  PaymentError,
  formatErrorMessage,
} from "./lib/errors";
import {
  calculateTotalAmount,
  convertToSmallestUnit,
  verifyPaymentAmount,
} from "./lib/money";
import { checkRateLimit, RATE_LIMIT_POLICIES } from "./lib/rateLimiting";

/**
 * الحصول على Stripe مع التحقق من المفاتيح
 */
function getStripe() {
  try {
    const stripeKey = validateApiKey(
      process.env.STRIPE_SECRET_KEY,
      "STRIPE_SECRET_KEY"
    );

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require("stripe").default;
    return new Stripe(stripeKey);
  } catch (error) {
    throw new PaymentError(
      ERROR_MESSAGES.CONFIG_STRIPE_KEY_MISSING
    );
  }
}

/**
 * الحصول على رابط التطبيق مع التحقق
 */
function getPublicAppUrl() {
  const publicAppUrl = process.env.SITE_URL || process.env.PUBLIC_APP_URL;
  return validateUrl(
    publicAppUrl,
    "SITE_URL أو PUBLIC_APP_URL"
  );
}

export const createCheckoutSession = action({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ url: string | null; sessionId: string }> => {
    try {
      // التحقق من تسجيل الدخول
      const userId = (await ctx.auth.getUserIdentity())?.subject;
      if (!userId) {
        throw new PaymentError(ERROR_MESSAGES.MUST_LOGIN);
      }

      // التحقق من معدل الطلبات
      if (!checkRateLimit(userId, "PAYMENT")) {
        throw new PaymentError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      }

      // جلب بيانات الحجز والشقة
      const paymentContext = await ctx.runQuery(
        internal.bookings.getPaymentContext,
        { bookingId: args.bookingId },
      );

      if (!paymentContext?.booking || !paymentContext.apartment) {
        throw new PaymentError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      }

      const { booking, apartment } = paymentContext;

      // التحقق من أن الحجز ملك للمستخدم
      if (booking.userId !== userId) {
        throw new PaymentError(ERROR_MESSAGES.PAYMENT_NOT_YOURS);
      }

      // التحقق من حالة الحجز
      if (booking.status !== "pending" || booking.paymentStatus !== "unpaid") {
        throw new PaymentError(ERROR_MESSAGES.PAYMENT_ALREADY_PAID);
      }

      // حساب المبلغ الإجمالي بأمان
      const amount = calculateTotalAmount(
        booking.totalPrice,
        booking.platformFee
      );

      // تحويل إلى أصغر وحدة (هللة) للـ Stripe
      const amountInHalalah = convertToSmallestUnit(amount);

      // الحصول على Stripe و URL
      const stripe = getStripe();
      const publicAppUrl = getPublicAppUrl();

      // إنشاء جلسة الدفع
      let session;
      try {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "sar",
                product_data: {
                  name: `حجز: ${apartment.titleAr || apartment.title}`,
                  description: `حجز شقة في العلا - رقم الحجز: ${args.bookingId}`,
                },
                unit_amount: amountInHalalah,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${publicAppUrl}/my-bookings?booking=${args.bookingId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${publicAppUrl}/apartment/${booking.apartmentId}`,
          metadata: {
            bookingId: args.bookingId,
            userId: booking.userId,
          },
        });
      } catch (stripeError) {
        console.error("Stripe Error:", stripeError);
        throw new PaymentError(
          "حدث خطأ أثناء إنشاء جلسة الدفع. حاول مرة أخرى"
        );
      }

      if (!session?.id) {
        throw new PaymentError("فشل في إنشاء جلسة الدفع");
      }

      // حفظ معرف جلسة الدفع
      try {
        await ctx.runMutation(internal.bookings.attachPaymentSession, {
          bookingId: args.bookingId,
          sessionId: session.id,
        });
      } catch (dbError) {
        console.error("Database Error:", dbError);
        throw new PaymentError("فشل في حفظ بيانات الحجز");
      }

      return { url: session.url, sessionId: session.id };
    } catch (error) {
      // تسجيل الخطأ للمراقبة
      console.error("Create Checkout Session Error:", error);

      // إرجاع رسالة خطأ ودية
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(formatErrorMessage(error));
    }
  },
});

export const verifyPayment = action({
  args: {
    bookingId: v.id("bookings"),
    sessionId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ paid: boolean; status: string }> => {
    try {
      // التحقق من تسجيل الدخول
      const userId = (await ctx.auth.getUserIdentity())?.subject;
      if (!userId) {
        throw new PaymentError(ERROR_MESSAGES.MUST_LOGIN);
      }

      // التحقق من معدل الطلبات (أكثر تقييداً للدفع)
      if (!checkRateLimit(userId, "PAYMENT_RETRY")) {
        throw new PaymentError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      }

      // التحقق من معرف جلسة الدفع
      if (!args.sessionId || args.sessionId.trim() === "") {
        throw new PaymentError("معرف جلسة الدفع مفقود");
      }

      // جلب بيانات الحجز
      const paymentContext = await ctx.runQuery(
        internal.bookings.getPaymentContext,
        { bookingId: args.bookingId },
      );

      if (!paymentContext?.booking) {
        throw new PaymentError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      }

      // التحقق من أن الحجز ملك للمستخدم
      if (paymentContext.booking.userId !== userId) {
        throw new PaymentError(ERROR_MESSAGES.PAYMENT_NOT_YOURS);
      }

      // الحصول على Stripe والتحقق من الجلسة
      const stripe = getStripe();
      let session;

      try {
        session = await stripe.checkout.sessions.retrieve(args.sessionId);
      } catch (stripeError) {
        console.error("Stripe Retrieve Error:", stripeError);
        throw new PaymentError(ERROR_MESSAGES.PAYMENT_SESSION_INVALID);
      }

      if (!session) {
        throw new PaymentError(ERROR_MESSAGES.PAYMENT_SESSION_INVALID);
      }

      // التحقق من البيانات الوصفية (metadata)
      if (
        session.metadata?.bookingId !== args.bookingId ||
        session.metadata?.userId !== userId
      ) {
        throw new PaymentError(ERROR_MESSAGES.PAYMENT_METADATA_MISMATCH);
      }

      // التحقق من المبلغ المدفوع
      const expectedAmount = convertToSmallestUnit(
        calculateTotalAmount(
          paymentContext.booking.totalPrice,
          paymentContext.booking.platformFee
        )
      );

      try {
        verifyPaymentAmount(expectedAmount, session.amount_total || 0);
      } catch (amountError) {
        console.error("Amount Verification Error:", amountError);
        throw new PaymentError(ERROR_MESSAGES.PAYMENT_AMOUNT_MISMATCH);
      }

      // التحقق من حالة الدفع
      if (session.payment_status !== "paid") {
        return { paid: false, status: session.payment_status || "unpaid" };
      }

      // تحديث حالة الحجز كمدفوع
      try {
        await ctx.runMutation(internal.bookings.markPaid, {
          bookingId: args.bookingId,
          sessionId: args.sessionId,
        });
      } catch (dbError) {
        console.error("Mark Paid Error:", dbError);
        throw new PaymentError("فشل في تحديث حالة الحجز");
      }

      return { paid: true, status: session.payment_status };
    } catch (error) {
      // تسجيل الخطأ للمراقبة
      console.error("Verify Payment Error:", error);

      // إرجاع رسالة خطأ ودية
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(formatErrorMessage(error));
    }
  },
});

/**
 * إنهاء جلسة دفع منتهية (يستدعى من Stripe Webhook فقط):
 * يلغي الحجز غير المدفوع بعد انتهاء جلسة الدفع.
 */
export const expireUnpaidSession = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return { expired: false };

    if (
      booking.paymentStatus !== "unpaid" ||
      booking.paymentSessionId !== args.sessionId ||
      booking.status !== "pending"
    ) {
      return { expired: false };
    }

    await ctx.db.patch(args.bookingId, { status: "cancelled" });
    return { expired: true };
  },
});
