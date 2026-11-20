import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { normalizeSaudiPhone } from "./whatsapp";

/** جلب جميع المالكين (role = owner) */
export const getAllOwners = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all.filter((u) => u.role === "owner");
  },
});

/** جلب شقق مالك معين */
export const getOwnerApartments = internalQuery({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    return await ctx.db
      .query("apartments")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();
  },
});

/** جلب الحجوزات أو محاولات الدفع المتروكة لاستعادتها عبر الواتساب */
export const getAbandonedCheckouts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const minAge = 30 * 60 * 1000; // 30 دقيقة
    const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة

    const candidates: Array<{
      bookingId?: any;
      analyticsId?: any;
      phone: string;
      apartmentTitle: string;
      guestName?: string;
    }> = [];

    // 1. الحجوزات غير المدفوعة المعلقة
    const unpaidBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    for (const b of unpaidBookings) {
      if (
        b.paymentStatus === "unpaid" &&
        !b.abandonedReminderSent &&
        b.guestPhone &&
        now - b.createdAt >= minAge &&
        now - b.createdAt <= maxAge
      ) {
        const apt = await ctx.db.get(b.apartmentId);
        const normPhone = normalizeSaudiPhone(b.guestPhone);
        if (normPhone) {
          candidates.push({
            bookingId: b._id,
            phone: normPhone,
            apartmentTitle: apt?.titleAr || apt?.title || "شقة في العلا",
            guestName: b.guestName,
          });
        }
      }
    }

    // 2. سجلات بدء الدفع في التحليلات
    const checkoutRecords = await ctx.db
      .query("siteAnalytics")
      .withIndex("by_type_created", (q) =>
        q.eq("type", "checkout_started").gte("createdAt", now - maxAge)
      )
      .collect();

    for (const r of checkoutRecords) {
      if (
        !r.completed &&
        !r.reminderSent &&
        r.phone &&
        now - r.createdAt >= minAge
      ) {
        // تجنب التكرار إذا كان نفس الرقم مضافاً بالفعل
        const normPhone = normalizeSaudiPhone(r.phone);
        if (normPhone && !candidates.some((c) => c.phone === normPhone)) {
          let aptTitle = "شقة في العلا";
          if (r.apartmentId) {
            const apt = await ctx.db.get(r.apartmentId);
            if (apt) aptTitle = apt.titleAr || apt.title;
          }
          candidates.push({
            analyticsId: r._id,
            bookingId: r.bookingId,
            phone: normPhone,
            apartmentTitle: aptTitle,
          });
        }
      }
    }

    return candidates;
  },
});

/** تمييز الحجز أو سجل التحليلات بأنه تم إرسال تذكير الدفع */
export const markAbandonedReminderSent = internalMutation({
  args: {
    bookingId: v.optional(v.id("bookings")),
    analyticsId: v.optional(v.id("siteAnalytics")),
  },
  handler: async (ctx, args) => {
    if (args.bookingId) {
      await ctx.db.patch(args.bookingId, { abandonedReminderSent: true });
    }
    if (args.analyticsId) {
      await ctx.db.patch(args.analyticsId, { reminderSent: true });
    }
  },
});

/** جلب الحجوزات المؤكدة القادمة لإرسال دليل تسجيل الدخول (قبل الدخول بساعتين) */
export const getUpcomingCheckIns = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();

    const upcoming: Array<{
      bookingId: any;
      apartmentId: any;
      phone: string;
      guestName: string;
      apartmentTitle: string;
      location: string;
      checkInTime: string;
    }> = [];

    for (const b of confirmedBookings) {
      if (
        b.paymentStatus === "paid" &&
        !b.checkInGuideSent &&
        b.guestPhone
      ) {
        // نافذة الدخول: قبل موعد الدخول بساعتين ونصف حتى وقت الدخول أو بعده بقليل
        const timeUntilCheckIn = b.checkIn - now;
        if (timeUntilCheckIn <= 2.5 * 60 * 60 * 1000 && timeUntilCheckIn >= -8 * 60 * 60 * 1000) {
          const normPhone = normalizeSaudiPhone(b.guestPhone);
          if (normPhone) {
            const apt = await ctx.db.get(b.apartmentId);
            upcoming.push({
              bookingId: b._id,
              apartmentId: b.apartmentId,
              phone: normPhone,
              guestName: b.guestName || "ضيف العلا",
              apartmentTitle: apt?.titleAr || apt?.title || "شقة في العلا",
              location: apt?.locationAr || apt?.location || "العلا",
              checkInTime: apt?.checkInTime || "3:00 مساءً",
            });
          }
        }
      }
    }

    return upcoming;
  },
});

/** تمييز الحجز بأنه تم إرسال دليل الدخول */
export const markCheckInGuideSent = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { checkInGuideSent: true });
  },
});

/** جلب الحجوزات المنتهية لإرسال طلب تقييم الإقامة (بعد المغادرة بساعتين) */
export const getCompletedBookingsForReview = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allBookings = await ctx.db.query("bookings").collect();

    const forReview: Array<{
      bookingId: any;
      apartmentId: any;
      phone: string;
      guestName: string;
      apartmentTitle: string;
    }> = [];

    for (const b of allBookings) {
      if (
        (b.status === "confirmed" || b.status === "completed") &&
        b.paymentStatus === "paid" &&
        !b.reviewPromptSent &&
        b.guestPhone
      ) {
        const timeSinceCheckOut = now - b.checkOut;
        // مر على وقت المغادرة ساعتان على الأقل ولم يمر أكثر من 48 ساعة
        if (timeSinceCheckOut >= 2 * 60 * 60 * 1000 && timeSinceCheckOut <= 48 * 60 * 60 * 1000) {
          const normPhone = normalizeSaudiPhone(b.guestPhone);
          if (normPhone) {
            const apt = await ctx.db.get(b.apartmentId);
            forReview.push({
              bookingId: b._id,
              apartmentId: b.apartmentId,
              phone: normPhone,
              guestName: b.guestName || "ضيف العلا",
              apartmentTitle: apt?.titleAr || apt?.title || "شقة في العلا",
            });
          }
        }
      }
    }

    return forReview;
  },
});

/** تمييز الحجز بأنه تم إرسال طلب التقييم وإكمال الحجز */
export const markReviewPromptSent = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, {
      reviewPromptSent: true,
      status: "completed",
    });
  },
});

/** جلب الحجوزات المعلقة التي تأخر المالك في الرد عليها لأكثر من ساعتين */
export const getDelayedHostBookings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const pending = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const delayed: Array<{
      bookingId: any;
      apartmentId: any;
      ownerPhone?: string;
      ownerName: string;
      apartmentTitle: string;
      invoiceNumber: string;
      guestName: string;
    }> = [];

    for (const b of pending) {
      if (
        !b.hostDelayAlertSent &&
        now - b.createdAt >= twoHours &&
        now - b.createdAt < oneDay
      ) {
        const apt = await ctx.db.get(b.apartmentId);
        if (apt?.ownerId) {
          const owner = await ctx.db.get(apt.ownerId);
          const ownerProf = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", apt.ownerId!))
            .unique();
          const rawPhone = ownerProf?.phone || owner?.phone;
          delayed.push({
            bookingId: b._id,
            apartmentId: b.apartmentId,
            ownerPhone: rawPhone ? normalizeSaudiPhone(rawPhone) : undefined,
            ownerName: owner?.name || "المستضيف",
            apartmentTitle: apt.titleAr || apt.title,
            invoiceNumber: b.invoiceNumber || b._id.slice(-6).toUpperCase(),
            guestName: b.guestName || "ضيف العلا",
          });
        }
      }
    }

    return delayed;
  },
});

/** تمييز الحجز بأنه تم إرسال تنبيه تأخر المالك */
export const markHostDelayAlertSent = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { hostDelayAlertSent: true });
  },
});

/** جلب الحجوزات المعلقة التي تجاوزت 24 ساعة دون رد لإلغائها تلقائياً */
export const getExpiredUnansweredBookings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const pending = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const expired: Array<{
      bookingId: any;
      apartmentId: any;
      guestPhone?: string;
      guestName: string;
      apartmentTitle: string;
      invoiceNumber: string;
    }> = [];

    for (const b of pending) {
      if (b.paymentStatus === "unpaid" && now - b.createdAt >= oneDay) {
        const apt = await ctx.db.get(b.apartmentId);
        expired.push({
          bookingId: b._id,
          apartmentId: b.apartmentId,
          guestPhone: b.guestPhone ? normalizeSaudiPhone(b.guestPhone) : undefined,
          guestName: b.guestName || "ضيف العلا",
          apartmentTitle: apt?.titleAr || apt?.title || "شقة في العلا",
          invoiceNumber: b.invoiceNumber || b._id.slice(-6).toUpperCase(),
        });
      }
    }

    return expired;
  },
});

/** إلغاء الحجز منتهي الصلاحية */
export const autoCancelExpiredBooking = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { status: "cancelled" });
  },
});
