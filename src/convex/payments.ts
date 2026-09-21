"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

function getStripe() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe").default;
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

export const createCheckoutSession = action({
  args: {
    bookingId: v.id("bookings"),
    apartmentTitle: v.string(),
    amount: v.number(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sar",
            product_data: {
              name: `حجز: ${args.apartmentTitle}`,
              description: `حجز شقة في العلا - رقم الحجز: ${args.bookingId}`,
            },
            unit_amount: Math.round(args.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${args.successUrl}?session_id={CHECKOUT_SESSION_ID}&booking=${args.bookingId}`,
      cancel_url: args.cancelUrl,
      metadata: {
        bookingId: args.bookingId,
      },
    });

    return { url: session.url, sessionId: session.id };
  },
});

export const verifyPayment = action({
  args: { sessionId: v.string() },
  handler: async (_ctx, args) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);
    return {
      status: session.payment_status,
      paid: session.payment_status === "paid",
    };
  },
});
