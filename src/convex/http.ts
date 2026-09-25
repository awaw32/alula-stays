import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Webhook الدفع من Stripe — المصدر الموثوق الوحيد لتأكيد الدفع.
 * يتحقق من توقيع الطلب عبر STRIPE_WEBHOOK_SECRET ثم يحدّث الحجز.
 * منع إعادة المعالجة: إذا كان الحجز مدفوعاً بالفعل يتجاهل الطلب بهدوء.
 */
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: "webhook not configured" }), {
        status: 500,
      });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "missing signature" }), { status: 400 });
    }

    const payload = await request.text();

    // التحقق من التوقيع عبر Stripe SDK (متاح في بيئة node)
    type StripeEvent = { type: string; data: { object: { id?: string; metadata?: Record<string, string> } } };
    let event: StripeEvent | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require("stripe").default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "invalid signature" }), { status: 400 });
    }

    if (!event) {
      return new Response(JSON.stringify({ error: "invalid event" }), { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId as string | undefined;
        const sessionId = session.id;
        if (!bookingId) {
          return new Response(JSON.stringify({ received: true, skipped: "no bookingId" }), { status: 200 });
        }
        try {
          await ctx.runMutation(internal.bookings.markPaid, {
            bookingId: bookingId as never,
            sessionId,
          });
        } catch (err) {
          // markPaid يرفض إذا كان مدفوعاً بالفعل أو الحالة غير صالحة — نعتبره نجاحاً لتفادي إعادة الإرسال
          console.error("Webhook markPaid error (may be idempotent skip):", err);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId as string | undefined;
        if (bookingId) {
          try {
            await ctx.runMutation(internal.payments.expireUnpaidSession, {
              bookingId: bookingId as never,
              sessionId: session.id,
            });
          } catch (err) {
            console.error("Webhook expire error:", err);
          }
        }
        break;
      }
      // الأحداث الأخرى (invoice/refund) تُعالج لاحقاً عند تفعيل الاسترداد الآلي
      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }),
});

export default http;
