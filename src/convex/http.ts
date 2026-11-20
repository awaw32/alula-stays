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
        const sessionId = (session.id ?? "") as string;
        if (!bookingId || !sessionId) {
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
            await ctx.runMutation(internal.bookings.expireUnpaidSession, {
              bookingId: bookingId as never,
              sessionId: (session.id ?? "") as string,
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

/**
 * Webhook الدفع من بوابة Tap Payments
 * يستقبل تحديثات الشحنات (CAPTURED, DECLINED, FAILED)
 */
http.route({
  path: "/tap-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = (await request.json()) as {
        id?: string;
        status?: string;
        metadata?: { bookingId?: string };
      };

      if (!payload || !payload.id) {
        return new Response(JSON.stringify({ error: "invalid payload" }), { status: 400 });
      }

      if (payload.status === "CAPTURED") {
        const bookingId = payload.metadata?.bookingId;
        if (bookingId) {
          try {
            await ctx.runMutation(internal.bookings.markPaid, {
              bookingId: bookingId as never,
              sessionId: payload.id,
            });
          } catch (err) {
            console.error("Tap webhook markPaid error (idempotent skip):", err);
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
      console.error("Tap webhook error:", err);
      return new Response(JSON.stringify({ error: "internal error" }), { status: 500 });
    }
  }),
});

// Telegram webhook for binding guests and handling callbacks
http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Handle /start command to bind chatId to user
      if (body.message && body.message.text && body.message.text.startsWith("/start")) {
        const parts = body.message.text.split(/\s+/);
        const payload = parts[1] || "";
        const chatId = body.message.from?.id?.toString();
        if (!chatId) return new Response(JSON.stringify({ error: "missing chatId" }), { status: 400 });

        if (payload) {
          const res = await ctx.runMutation(internal.telegramDb.bindTelegramChat, {
            payload,
            chatId,
          });

          if (res.success) {
            await ctx.runAction(internal.telegram.sendTelegramMessage, {
              chatId,
              text: `✅ مرحباً بك ${res.name}!\nتم ربط حسابك في شقق العلا بنجاح. ستصلك الآن الإشعارات والتذكيرات اليومية هنا.`,
            });
          } else {
            await ctx.runAction(internal.telegram.sendTelegramMessage, {
              chatId,
              text: "⚠️ لم نتمكن من العثور على حساب مطابق. تأكد من استخدام الرابط المخصص من لوحة تحكمك.",
            });
          }
        }
        return new Response(JSON.stringify({ ok: true }));
      }

      // Handle inline button callbacks
      if (body.callback_query) {
        const data = body.callback_query.data as string;
        const fromId = body.callback_query.from?.id?.toString();
        const [action, apartmentId] = data.split(":");
        const avail = action === "avail_yes";

        if (apartmentId) {
          const res = await ctx.runMutation(internal.telegramDb.updateApartmentAvailability, {
            apartmentId,
            available: avail,
          });

          if (fromId) {
            const statusText = avail ? "✅ متاحة للحجز" : "❌ محجوزة خارجياً";
            const text = res.success
              ? `تم تحديث حالة (${res.title}) بنجاح إلى: ${statusText}`
              : `تم تحديث حالة الشقة إلى: ${statusText}`;

            await ctx.runAction(internal.telegram.sendTelegramMessage, {
              chatId: fromId,
              text,
            });
          }
        }
        return new Response(JSON.stringify({ ok: true }));
      }

      return new Response(JSON.stringify({ ok: true }));
    } catch (err: any) {
      console.error("Telegram webhook error:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }),
});

export default http;
