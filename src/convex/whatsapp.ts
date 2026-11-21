import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/authorization";

/**
 * تحويل أي رقم سعودي تلقائياً لصيغة واتساب الدولية المعتمدة (9665xxxxxxxx)
 * بدون مسافات أو رموز، مع تحويل الأرقام العربية إلى لاتينية.
 */
export function normalizeSaudiPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = (phone || "").trim().replace(/[^\d]/g, "");
  // تحويل الأرقام العربية/الهندية إلى أرقام لاتينية
  cleaned = cleaned.replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)] || d);

  if (cleaned.startsWith("00966")) {
    cleaned = "966" + cleaned.slice(5);
  } else if (cleaned.startsWith("966")) {
    // الرقم يبدأ بـ 966 بالفعل
  } else if (cleaned.startsWith("05") && cleaned.length === 10) {
    cleaned = "966" + cleaned.slice(1);
  } else if (cleaned.startsWith("5") && cleaned.length === 9) {
    cleaned = "966" + cleaned;
  }
  return cleaned;
}

/**
 * استرجاع جميع الرسائل المعلقة (status = "pending") لإرسالها عبر بوت الواتساب.
 * حماية الأمان عند انقطاع السيرفر: يتم استثناء أي رسالة OTP مر على إنشائها أكثر من 5 دقائق
 * لتفادي إرسال أكواد منتهية الصلاحية بعد إعادة تشغيل الجوال.
 */
export const getPendingMessages = query({
  args: {},
  handler: async (ctx) => {
    const allPending = await ctx.db
      .query("whatsappQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const now = Date.now();
    return allPending.filter((msg) => {
      // استثناء رسائل OTP المنتهية (أكثر من 5 دقائق)
      if (msg.type === "otp" && now - msg.createdAt > 5 * 60 * 1000) {
        return false;
      }
      return true;
    });
  },
});

/**
 * تحديث الحالة إلى "sent" بعد الإرسال الفعلي عبر واتساب
 */
export const markMessageSent = mutation({
  args: { id: v.id("whatsappQueue") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "sent" as const,
      sentAt: Date.now(),
    });
  },
});

/**
 * تحديث الحالة إلى "failed" أو زيادة عدد المحاولات عند تعذر الإرسال
 */
export const markMessageFailed = mutation({
  args: {
    id: v.id("whatsappQueue"),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { id, error }) => {
    const msg = await ctx.db.get(id);
    if (!msg) return;
    const retryCount = (msg.retryCount || 0) + 1;
    await ctx.db.patch(id, {
      status: retryCount >= 3 ? ("failed" as const) : ("pending" as const),
      retryCount,
      error: error || "تعذر الإرسال",
    });
  },
});

/**
 * إضافة رسالة عامة إلى طابور الواتساب
 */
export const enqueueMessage = internalMutation({
  args: {
    ownerId: v.optional(v.id("users")),
    ownerPhone: v.string(),
    apartmentId: v.optional(v.id("apartments")),
    bookingId: v.optional(v.id("bookings")),
    message: v.string(),
    type: v.optional(
      v.union(
        v.literal("otp"),
        v.literal("booking_request"),
        v.literal("booking_update"),
        v.literal("invoice"),
        v.literal("daily_check"),
        v.literal("test"),
        v.literal("general"),
        v.literal("review_request"),
        v.literal("checkin_guide"),
        v.literal("abandoned_checkout"),
        v.literal("daily_report"),
        v.literal("admin_alert"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const phone = normalizeSaudiPhone(args.ownerPhone);
    return await ctx.db.insert("whatsappQueue", {
      ownerId: args.ownerId,
      ownerPhone: phone,
      apartmentId: args.apartmentId,
      bookingId: args.bookingId,
      message: args.message,
      type: args.type || "general",
      status: "pending" as const,
      createdAt: Date.now(),
    });
  },
});

/**
 * إدراج كود التحقق (OTP) في طابور الواتساب مع التحقق من معدل الإرسال (Rate Limit: 60s)
 * وحفظ صلاحية الكود لمدة 5 دقائق.
 */
export const enqueueOtpMessage = internalMutation({
  args: {
    phone: v.string(),
    code: v.string(),
  },
  handler: async (ctx, { phone, code }) => {
    const normalizedPhone = normalizeSaudiPhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new Error("رقم الجوال المدخل غير صحيح");
    }

    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 دقائق

    // فحص حماية التكرار (Rate Limit: 30 ثانية لتسهيل طلب الرمز مجدداً دون تعليق)
    const existing = await ctx.db
      .query("phoneVerifications")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    if (existing && now - existing.lastSentAt < 30 * 1000) {
      const waitSeconds = Math.ceil((30 * 1000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`يرجى الانتظار ${waitSeconds} ثانية قبل طلب رمز تحقق جديد.`);
    }

    // تنظيف أي رسائل OTP معلقة قديمة لنفس الرقم في طابور الواتساب
    // لضمان عدم إرسال أكواد متراكمة قديمة عند إعادة المحاولة
    const oldPendingOtps = await ctx.db
      .query("whatsappQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    for (const oldMsg of oldPendingOtps) {
      if (oldMsg.type === "otp" && oldMsg.ownerPhone === normalizedPhone) {
        await ctx.db.patch(oldMsg._id, { status: "failed", error: "استبدل برمز أحدث" });
      }
    }

    // حفظ كود التحقق الجديد في قاعدة البيانات
    if (existing) {
      await ctx.db.patch(existing._id, {
        code,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      });
    } else {
      await ctx.db.insert("phoneVerifications", {
        phone: normalizedPhone,
        code,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      });
    }

    // إدراج الرسالة في طابور الواتساب فوراً
    const message = `رمز التحقق الخاص بك في منصة شقق العلا هو: ${code} (صالح لمدة 5 دقائق).\n\nلا تشارك هذا الرمز مع أي شخص حفاظاً على أمان حسابك 🔒.`;
    await ctx.db.insert("whatsappQueue", {
      ownerPhone: normalizedPhone,
      message,
      type: "otp",
      status: "pending" as const,
      createdAt: now,
    });

    return { success: true, phone: normalizedPhone };
  },
});

/**
 * طلب إرسال كود تحقق جديد عبر الواتساب (للاستخدام المباشر من الواجهة)
 */
export const sendOtp = mutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const normalized = normalizeSaudiPhone(phone);
    if (!normalized || normalized.length < 10) {
      throw new Error("يرجى إدخال رقم جوال سعودي صحيح (مثال: 0501234567)");
    }

    const now = Date.now();

    // فحص Rate Limit 60 ثانية
    const existing = await ctx.db
      .query("phoneVerifications")
      .withIndex("by_phone", (q) => q.eq("phone", normalized))
      .first();

    if (existing && now - existing.lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`يرجى الانتظار ${waitSeconds} ثانية قبل طلب رمز تحقق جديد.`);
    }

    // توليد كود عشوائي من 6 أرقام
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 5 * 60 * 1000;

    if (existing) {
      await ctx.db.patch(existing._id, {
        code,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      });
    } else {
      await ctx.db.insert("phoneVerifications", {
        phone: normalized,
        code,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      });
    }

    // إدراج رسالة فورية في طابور الواتساب
    const message = `رمز التحقق الخاص بك في منصة شقق العلا هو: ${code} (صالح لمدة 5 دقائق).\n\nلا تشارك هذا الرمز مع أي شخص حفاظاً على أمان حسابك 🔒.`;
    await ctx.db.insert("whatsappQueue", {
      ownerPhone: normalized,
      message,
      type: "otp",
      status: "pending" as const,
      createdAt: now,
    });

    return { success: true, phone: normalized };
  },
});

/**
 * التحقق من الكود وإتمام تسجيل/دخول المستخدم
 */
export const verifyOtp = mutation({
  args: {
    phone: v.string(),
    code: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { phone, code, name }) => {
    const normalized = normalizeSaudiPhone(phone);
    const cleanCode = code.trim();

    const record = await ctx.db
      .query("phoneVerifications")
      .withIndex("by_phone", (q) => q.eq("phone", normalized))
      .first();

    if (!record) {
      throw new Error("لم يتم طلب رمز تحقق لهذا الرقم أو انتهت صلاحيته.");
    }

    if (record.attempts >= 5) {
      throw new Error("تم تجاوز عدد المحاولات المسموح بها، يرجى طلب رمز جديد.");
    }

    if (Date.now() > record.expiresAt) {
      throw new Error("انتهت صلاحية رمز التحقق (صالح 5 دقائق فقط). يرجى طلب رمز جديد.");
    }

    if (record.code !== cleanCode) {
      await ctx.db.patch(record._id, { attempts: record.attempts + 1 });
      throw new Error("رمز التحقق غير صحيح. يرجى التأكد وإعادة المحاولة.");
    }

    // الرمز صحيح — مسح كود التحقق
    await ctx.db.delete(record._id);

    // البحث عن المستخدم أو إنشاؤه
    const allUsers = await ctx.db.query("users").collect();
    const existingUser = allUsers.find((u) => {
      if (!u.phone) return false;
      const uNorm = normalizeSaudiPhone(u.phone);
      return uNorm === normalized || u.phone.endsWith(normalized.slice(-9));
    });

    let targetUserId;
    if (existingUser) {
      targetUserId = existingUser._id;
      await ctx.db.patch(existingUser._id, {
        phoneVerificationTime: Date.now(),
        ...(name && !existingUser.name ? { name: name.trim() } : {}),
      });
    } else {
      targetUserId = await ctx.db.insert("users", {
        phone: normalized,
        name: name ? name.trim() : "ضيف العلا",
        role: "user",
        phoneVerificationTime: Date.now(),
      });
    }

    const user = await ctx.db.get(targetUserId);
    return { success: true, userId: targetUserId, user };
  },
});

/**
 * معالجة رد المالك التفاعلي (1 أو 2) على الواتساب وتحديث الحجز أو توفر الشقة،
 * مع إرسال رسائل التحديث التلقائية للنزيل والمالك.
 */
export const recordReplyByPhone = mutation({
  args: {
    ownerPhone: v.string(),
    reply: v.number(),
  },
  handler: async (ctx, { ownerPhone, reply }) => {
    const normalizedPhone = normalizeSaudiPhone(ownerPhone);

    // جلب جميع الرسائل المرسلة بانتظار الرد لهذا الرقم
    const allSent = await ctx.db
      .query("whatsappQueue")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .collect();

    const sorted = allSent
      .filter((m) => normalizeSaudiPhone(m.ownerPhone) === normalizedPhone)
      .sort((a, b) => b.createdAt - a.createdAt);

    const latest = sorted[0];
    if (!latest) {
      throw new Error("لا توجد رسالة مرسلة لهذا الرقم بانتظار الرد.");
    }

    const now = Date.now();
    let ownerMessage = "";

    // 0. إذا كان الرد على طلب تقييم الإقامة (review_request) بالدرجة 1 إلى 5
    if (latest.type === "review_request") {
      const rating = Math.min(5, Math.max(1, Math.round(reply)));
      if (latest.apartmentId) {
        let booking: any = null;
        if (latest.bookingId) {
          booking = await ctx.db.get(latest.bookingId);
        }

        const allUsers = await ctx.db.query("users").collect();
        const guestUser = allUsers.find((u) => {
          if (!u.phone) return false;
          const uNorm = normalizeSaudiPhone(u.phone);
          return uNorm === normalizedPhone || u.phone.endsWith(normalizedPhone.slice(-9));
        });

        // حفظ التقييم في جدول reviews
        await ctx.db.insert("reviews", {
          apartmentId: latest.apartmentId,
          userId: booking?.userId || guestUser?._id || (allUsers[0]?._id as any),
          userName: booking?.guestName || guestUser?.name || "ضيف العلا",
          rating,
          comment: `تقييم الضيف عبر الواتساب (${rating} من 5 نجوم ⭐)`,
          createdAt: now,
        });

        // تحديث إحصاءات الشقة
        const existingReviews = await ctx.db
          .query("reviews")
          .withIndex("by_apartment", (q) => q.eq("apartmentId", latest.apartmentId!))
          .collect();
        const totalRating = existingReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / (existingReviews.length || 1);
        await ctx.db.patch(latest.apartmentId, {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: existingReviews.length,
        });

        ownerMessage = `⭐ شكراً جزيلاً لتقييمك (${rating} نجوم)! يسعدنا دائماً استضافتك في العلا ونرجو أن نراك قريباً 🌿✨`;

        await ctx.db.patch(latest._id, {
          status: "replied" as const,
          reply: rating,
          repliedAt: now,
        });

        return {
          success: true,
          ownerMessage,
          action: "review_recorded",
          reply: rating,
        };
      }
    }

    if (reply !== 1 && reply !== 2) {
      throw new Error("يرجى الرد بـ 1 أو 2 فقط لتحديد حالة الحجز أو توفر الشقة.");
    }

    // 1. إذا كان الرد على طلب حجز جديد (booking_request)
    if (latest.bookingId) {
      const booking = await ctx.db.get(latest.bookingId);
      if (booking) {
        const apartment = await ctx.db.get(booking.apartmentId);
        const aptTitle = apartment?.titleAr || apartment?.title || "الشقة";
        const checkInDate = new Date(booking.checkIn).toLocaleDateString("ar-SA");
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString("ar-SA");
        const invNum = booking.invoiceNumber || booking._id.slice(-6).toUpperCase();

        if (reply === 1) {
          // المالك وافق على الحجز
          await ctx.db.patch(booking._id, { status: "confirmed" });

          ownerMessage = `✅ تم اعتماد موافقتك على الحجز #${invNum} بنجاح!\nتم إشعار الضيف لمتابعة الدفع والتنسيق.`;

          // إرسال رسالة واتساب للنزيل تفيد بموافقة المالك مع رابط الفاتورة والدفع
          if (booking.guestPhone) {
            const guestNorm = normalizeSaudiPhone(booking.guestPhone);
            if (guestNorm) {
              const guestMsg =
                `🎉 بشرى سارة من شقق العلا!\n\n` +
                `وافق مالك "${aptTitle}" على طلب حجزك بنجاح.\n` +
                `📅 الفترة: من ${checkInDate} إلى ${checkOutDate} (${booking.totalNights} ليالٍ)\n` +
                `💰 المبلغ الإجمالي: ${booking.totalPrice.toLocaleString()} ر.س\n` +
                `🧾 رقم الفاتورة: #${invNum}\n\n` +
                `يرجى إتمام الدفع أو استعراض بيانات الحجز عبر الرابط:\n` +
                `🔗 https://alulahome.com/my-bookings?booking=${booking._id}\n\n` +
                `إذا كان لديك أي استفسار، نحن هنا لمساعدتك دائماً 🌿`;

              await ctx.db.insert("whatsappQueue", {
                bookingId: booking._id,
                apartmentId: booking.apartmentId,
                ownerPhone: guestNorm,
                type: "booking_update",
                message: guestMsg,
                status: "pending",
                createdAt: now,
              });
            }
          }

          // إشعار داخل التطبيق للنزيل إن كان مسجلاً
          if (booking.userId) {
            await ctx.db.insert("notifications", {
              userId: booking.userId,
              type: "booking_confirmed",
              title: "🎉 وافق المالك على حجزك!",
              message: `تمت موافقة المالك على حجزك رقم (#${invNum}). يمكنك الآن استكمال السداد والاطلاع على التفاصيل.`,
              relatedBookingId: booking._id,
              relatedApartmentId: booking.apartmentId,
              actionUrl: `/my-bookings?booking=${booking._id}`,
              read: false,
              createdAt: now,
            });
          }
        } else if (reply === 2) {
          // المالك رفض الحجز
          await ctx.db.patch(booking._id, { status: "cancelled" });

          ownerMessage = `❌ تم تسجيل اعتذارك عن الحجز #${invNum} وإشعار الضيف بلطف.`;

          // إرسال رسالة واتساب للنزيل بالاعتذار واقتراح البدائل
          if (booking.guestPhone) {
            const guestNorm = normalizeSaudiPhone(booking.guestPhone);
            if (guestNorm) {
              const guestMsg =
                `أهلاً بك عزيزنا الضيف 🌿\n\n` +
                `نعتذر منك، لقد تعذر على مالك "${aptTitle}" قبول الحجز للفترة من ${checkInDate} إلى ${checkOutDate} نظراً لعدم التوفر.\n\n` +
                `يمكنك تصفح العديد من الشقق والشاليهات المتاحة الأخرى في العلا واختيار الأنسب لك:\n` +
                `🔗 https://alulahome.com/apartments\n\n` +
                `فريق شقق العلا يتمنى لك رحلة سعيدة دائماً! ✨`;

              await ctx.db.insert("whatsappQueue", {
                bookingId: booking._id,
                apartmentId: booking.apartmentId,
                ownerPhone: guestNorm,
                type: "booking_update",
                message: guestMsg,
                status: "pending",
                createdAt: now,
              });
            }
          }

          // إشعار داخل التطبيق للنزيل
          if (booking.userId) {
            await ctx.db.insert("notifications", {
              userId: booking.userId,
              type: "booking_cancelled",
              title: "⚠️ اعتذر المالك عن قبول الحجز",
              message: `نعتذر منك، لقد اعتذر المالك عن قبول طلب الحجز (#${invNum}). يمكنك استكشاف شقق أخرى مميزة.`,
              relatedBookingId: booking._id,
              relatedApartmentId: booking.apartmentId,
              actionUrl: "/apartments",
              read: false,
              createdAt: now,
            });
          }
        }
      }
    }

    // 2. إذا كان الرد على تذكير التوفر اليومي (daily_check)
    if (!latest.bookingId && latest.apartmentId) {
      const isAvailable = reply === 1;
      await ctx.db.patch(latest.apartmentId, { available: isAvailable });
      ownerMessage = isAvailable
        ? "✅ تم تحديث حالة شقتك: متاحة اليوم لاستقبال الحجوزات 🌴"
        : "❌ تم تحديث حالة شقتك: محجوزة خارجياً لليوم.";
    }

    // إذا لم يكن محدد شقة محددة بل للمالك عموماً
    if (!latest.bookingId && !latest.apartmentId && latest.ownerId) {
      const ownerApartments = await ctx.db
        .query("apartments")
        .withIndex("by_owner", (q) => q.eq("ownerId", latest.ownerId))
        .collect();
      const isAvailable = reply === 1;
      for (const apt of ownerApartments) {
        await ctx.db.patch(apt._id, { available: isAvailable });
      }
      ownerMessage = isAvailable
        ? `✅ تم تحديث حالة جميع شققك (${ownerApartments.length}) إلى: متاحة اليوم 🌴`
        : `❌ تم تحديث حالة جميع شققك (${ownerApartments.length}) إلى: محجوزة خارجياً لليوم.`;
    }

    // تحديث حالة رسالة الواتساب إلى "replied"
    await ctx.db.patch(latest._id, {
      status: "replied" as const,
      reply,
      repliedAt: now,
    });

    return {
      success: true,
      ownerMessage,
      action: latest.bookingId ? "booking_updated" : "availability_updated",
      reply,
    };
  },
});

/** اسم بديل متوافق مع recordReply */
export const recordReply = recordReplyByPhone;

/**
 * إعادة إرسال الفاتورة عبر واتساب (للضيف) مع حماية Rate Limit (رسالة كل 60 ثانية)
 */
export const resendInvoiceViaWhatsApp = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
      throw new Error("الحجز غير موجود");
    }

    // التأكد من الصلاحيات: صاحب الحجز أو مدير النظام (Admin)
    const isAdmin = user.role === "admin";
    if (booking.userId !== user._id && !isAdmin) {
      throw new Error("غير مصرح لك بإرسال فاتورة هذا الحجز");
    }

    const guestPhone = booking.guestPhone;
    if (!guestPhone) {
      throw new Error("لا يوجد رقم جوال مسجل لهذا الحجز");
    }

    const normalizedPhone = normalizeSaudiPhone(guestPhone);
    if (!normalizedPhone) {
      throw new Error("رقم جوال النزيل غير صالح");
    }

    const now = Date.now();

    // حماية Rate Limit: منع إعادة الإرسال لنفس الفاتورة خلال 60 ثانية
    const recentInvoice = await ctx.db
      .query("whatsappQueue")
      .withIndex("by_booking", (q) => q.eq("bookingId", bookingId))
      .filter((q) => q.eq(q.field("type"), "invoice"))
      .order("desc")
      .first();

    if (recentInvoice && now - recentInvoice.createdAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - recentInvoice.createdAt)) / 1000);
      throw new Error(`يرجى الانتظار ${waitSeconds} ثانية قبل إعادة إرسال الفاتورة.`);
    }

    const apartment = await ctx.db.get(booking.apartmentId);
    const aptTitle = apartment?.titleAr || apartment?.title || "شقة في العلا";
    const invoiceNum = booking.invoiceNumber || `INV-${new Date().getFullYear()}-${booking._id.slice(-6).toUpperCase()}`;
    const checkInDate = new Date(booking.checkIn).toLocaleDateString("ar-SA");
    const checkOutDate = new Date(booking.checkOut).toLocaleDateString("ar-SA");
    const guestName = booking.guestName || "ضيف العلا";
    const paymentStatusAr =
      booking.paymentStatus === "paid" ? "مسدد بالكامل ✅" : "بانتظار السداد ⏳";

    const invoiceMessage =
      `🧾 *فاتورة حجز مؤكد - منصة شقق العلا*\n\n` +
      `*رقم الفاتورة:* #${invoiceNum}\n` +
      `*رقم الحجز:* #${booking._id.slice(-6).toUpperCase()}\n` +
      `🏠 *الوحدة:* ${aptTitle}\n` +
      `👤 *النزيل:* ${guestName}\n` +
      `📅 *الدخول:* ${checkInDate}\n` +
      `📅 *الخروج:* ${checkOutDate} (${booking.totalNights} ليالٍ)\n\n` +
      `💵 *قيمة الإقامة:* ${(booking.totalPrice - booking.platformFee).toLocaleString()} ر.س\n` +
      `📋 *رسوم المنصة والخدمة:* ${booking.platformFee.toLocaleString()} ر.س\n` +
      `💰 *المبلغ الإجمالي:* ${booking.totalPrice.toLocaleString()} ر.س\n` +
      `💳 *حالة الدفع:* ${paymentStatusAr}\n\n` +
      `للاطلاع على الفاتورة وتفاصيل الموقع الجغرافي:\n` +
      `🔗 https://alulahome.com/my-bookings?booking=${booking._id}\n\n` +
      `نتمنى لك إقامة مميزة في العلا! 🌴✨`;

    await ctx.db.insert("whatsappQueue", {
      bookingId,
      apartmentId: booking.apartmentId,
      ownerPhone: normalizedPhone,
      message: invoiceMessage,
      type: "invoice",
      status: "pending",
      createdAt: now,
    });

    return { success: true, phone: normalizedPhone };
  },
});

/**
 * إرسال رسالة تجريبية فورية لأي رقم للتحقق من الاتصال
 */
export const sendTestMessage = mutation({
  args: {
    phone: v.string(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, { phone, text }) => {
    const normalized = normalizeSaudiPhone(phone);
    const message =
      text ||
      "مرحباً بك! 👋\nهذه رسالة تجريبية لتأكيد ربط وتشغيل سيرفر بوت الواتساب لمنصة شقق العلا بنجاح 🌿✨\n\nالنظام متصل وجاهز لإرسال أكواد التحقق وإشعارات الحجوزات.";

    const id = await ctx.db.insert("whatsappQueue", {
      ownerPhone: normalized,
      message,
      type: "test",
      status: "pending" as const,
      createdAt: Date.now(),
    });

    return { success: true, id, phone: normalized };
  },
});
