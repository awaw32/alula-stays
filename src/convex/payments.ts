"use node";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

function getStripe() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe").default;
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

function getPublicAppUrl() {
  const publicAppUrl = process.env.SITE_URL || process.env.PUBLIC_APP_URL;
  if (!publicAppUrl) {
    throw new Error("لم يتم إعداد رابط التطبيق العام للدفع");
  }

  return publicAppUrl.replace(/\/$/, "");
}

export const createCheckoutSession = action({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const paymentContext = await ctx.runQuery(
      internal.bookings.getPaymentContext,
      { bookingId: args.bookingId },
    );
    if (!paymentContext?.booking || !paymentContext.apartment) {
      throw new Error("الحجز أو الشقة غير موجودة");
    }

    const { booking, apartment } = paymentContext;
    if (booking.userId !== userId) {
      throw new Error("لا يمكنك دفع حجز ليس لك");
    }
    if (booking.status !== "pending" || booking.paymentStatus !== "unpaid") {
      throw new Error("لا يمكن الدفع لهذا الحجز حالياً");
    }

    const amount = booking.totalPrice + booking.platformFee;
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("قيمة الحجز غير صالحة");
    }

    const stripe = getStripe();
    const publicAppUrl = getPublicAppUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sar",
            product_data: {
              name: `حجز: ${apartment.titleAr || apartment.title}`,
              description: `حجز شقة في العلا - رقم الحجز: ${args.bookingId}`,
            },
            unit_amount: Math.round(amount * 100),
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

    await ctx.runMutation(internal.bookings.attachPaymentSession, {
      bookingId: args.bookingId,
      sessionId: session.id,
    });

    return { url: session.url, sessionId: session.id };
  },
});

export const verifyPayment = action({
  args: {
    bookingId: v.id("bookings"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const paymentContext = await ctx.runQuery(
      internal.bookings.getPaymentContext,
      { bookingId: args.bookingId },
    );
    if (!paymentContext?.booking) {
      throw new Error("الحجز غير موجود");
    }
    if (paymentContext.booking.userId !== userId) {
      throw new Error("لا يمكنك التحقق من حجز ليس لك");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);
    const expectedAmount =
      (paymentContext.booking.totalPrice + paymentContext.booking.platformFee) * 100;

    if (
      session.metadata?.bookingId !== args.bookingId ||
      session.metadata?.userId !== userId ||
      session.amount_total !== expectedAmount
    ) {
      throw new Error("بيانات جلسة الدفع لا تطابق الحجز");
    }

    if (session.payment_status !== "paid") {
      return { paid: false, status: session.payment_status };
    }

    await ctx.runMutation(internal.bookings.markPaid, {
      bookingId: args.bookingId,
      sessionId: args.sessionId,
    });

    return { paid: true, status: session.payment_status };
  },
});
