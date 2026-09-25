import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ERROR_MESSAGES, ValidationError } from "./lib/errors";

const DAY_MS = 1000 * 60 * 60 * 24;
const MAX_BLOCK_YEARS_AHEAD = 2;

/** بداية اليوم (بالتوقيت المحلي) لطابع زمني */
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** هل تتقاطع فترتان زمنيتان؟ [start1, end1) × [start2, end2) */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * فحص تعارض فترة حجز مع تواريخ محجوبة يدوياً (يستخدم من bookings.ts).
 */
export async function overlapsBlockedDates(
  ctx: QueryCtx,
  apartmentId: string,
  checkIn: number,
  checkOut: number,
): Promise<boolean> {
  const blocks = await ctx.db
    .query("blockedDates")
    .withIndex("by_apartment", (q) => q.eq("apartmentId", apartmentId))
    .collect();

  return blocks.some((block) =>
    rangesOverlap(checkIn, checkOut, block.startDate, block.endDate),
  );
}

/**
 * التواريخ غير المتاحة للشقة: أيام فيها حجز فعّال أو حجب يدوي.
 * يُستخدم لعرض التقويم للضيف وللمالك.
 */
export const unavailableDates = query({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) {
      throw new ValidationError(ERROR_MESSAGES.APARTMENT_NOT_FOUND);
    }

    const now = Date.now();

    // الأيام المحجوزة (حجوزات فعّالة فقط)
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const bookedRanges = bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => ({ start: b.checkIn, end: b.checkOut }));

    // الفترات المحجوبة يدوياً
    const blocks = await ctx.db
      .query("blockedDates")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const blockedRanges = blocks.map((b) => ({
      start: b.startDate,
      end: b.endDate,
      reason: b.reason,
    }));

    // تفريغ الفترات إلى أيام فردية (حد أقصى 180 يوماً في المستقبل لتفادي الضخامة)
    const horizon = startOfDay(now) + 180 * DAY_MS;
    const unavailable = new Set<number>();

    for (const range of [...bookedRanges, ...blockedRanges]) {
      let day = startOfDay(range.start);
      const end = Math.min(startOfDay(range.end), horizon);
      while (day < end) {
        unavailable.add(day);
        day += DAY_MS;
      }
    }

    return {
      unavailableDays: Array.from(unavailable).sort((a, b) => a - b),
      blockedRanges: blockedRanges.filter((r) => r.end > now),
    };
  },
});

/**
 * حجب فترة تواريخ من المالك (صيانة، استخدام شخصي...).
 */
export const blockDates = mutation({
  args: {
    apartmentId: v.id("apartments"),
    startDate: v.number(),
    endDate: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
    }

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) {
      throw new ValidationError(ERROR_MESSAGES.APARTMENT_NOT_FOUND);
    }
    // المالك فقط (الأدمن يُسمح له أيضاً)
    const owner = await ctx.db.get(userId);
    if (apartment.ownerId !== userId && owner?.role !== "admin") {
      throw new ValidationError("فقط مالك الشقة يمكنه حجب التواريخ");
    }

    const start = startOfDay(args.startDate);
    const end = startOfDay(args.endDate);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new ValidationError("تواريخ غير صالحة");
    }
    if (end <= start) {
      throw new ValidationError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
    }
    if (end < Date.now() - DAY_MS) {
      throw new ValidationError("لا يمكن حجب تواريخ في الماضي");
    }
    if (start > Date.now() + MAX_BLOCK_YEARS_AHEAD * 365 * DAY_MS) {
      throw new ValidationError(`لا يمكن الحجب لفترة تتجاوز ${MAX_BLOCK_YEARS_AHEAD} سنة`);
    }

    // التحقق من عدم وجود حجوزات فعّالة ضمن الفترة — يجب إلغاؤها أولاً
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const conflicting = bookings.filter(
      (b) =>
        b.status !== "cancelled" &&
        rangesOverlap(start, end, b.checkIn, b.checkOut),
    );
    if (conflicting.length > 0) {
      throw new ValidationError(
        "توجد حجوزات مؤكدة ضمن هذه الفترة — ألغِ الحجوزات أولاً قبل حجب التواريخ",
      );
    }

    const blockId = await ctx.db.insert("blockedDates", {
      apartmentId: args.apartmentId,
      startDate: start,
      endDate: end,
      reason: args.reason?.trim() || undefined,
      ownerId: userId,
      createdAt: Date.now(),
    });

    return { blockId, message: "تم حجب التواريخ بنجاح" };
  },
});

/**
 * إلغاء حجب فترة.
 */
export const unblockDates = mutation({
  args: { blockId: v.id("blockedDates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ValidationError(ERROR_MESSAGES.MUST_LOGIN);
    }

    const block = await ctx.db.get(args.blockId);
    if (!block) {
      throw new ValidationError("فترة الحجب غير موجودة");
    }

    const user = await ctx.db.get(userId);
    if (block.ownerId !== userId && user?.role !== "admin") {
      throw new ValidationError("فقط مالك الشقة يمكنه إلغاء الحجب");
    }

    await ctx.db.delete(args.blockId);
    return "تم إلغاء حجب التواريخ";
  },
});

/**
 * قائمة فترات الحجب النشطة لشقة (للمالك).
 */
export const listBlocked = query({
  args: { apartmentId: v.id("apartments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    const blocks = await ctx.db
      .query("blockedDates")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    // المالك يرى حجوبات شقته، والأدمن يرى الكل
    const isOwner = blocks.length > 0 && blocks[0].ownerId === userId;
    if (!isOwner && user.role !== "admin") {
      return [];
    }

    return blocks.filter((b) => b.endDate >= Date.now()).sort((a, b) => a.startDate - b.startDate);
  },
});
