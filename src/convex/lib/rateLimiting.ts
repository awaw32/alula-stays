/**
 * نظام Rate Limiting
 * حماية من الهجمات والاستخدام الزائد
 */

import { v } from "convex/values";

/**
 * نموذج للتحقق من معدل الطلبات
 */
const rateLimitStore = new Map<
  string,
  {
    timestamps: number[];
    blockedUntil: number;
  }
>();

/**
 * سياسات Rate Limiting المختلفة
 */
export const RATE_LIMIT_POLICIES = {
  // سياسة للعمليات العادية (البحث والقراءة)
  READ: {
    maxRequests: 100,
    windowMs: 60 * 1000, // دقيقة واحدة
  },
  // سياسة للعمليات الحساسة (الحجز والدفع)
  BOOKING: {
    maxRequests: 10,
    windowMs: 60 * 1000, // دقيقة واحدة
  },
  // سياسة الدفع (أكثر تقييداً)
  PAYMENT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // دقيقة واحدة
  },
  // سياسة تسجيل الدخول (حماية من الهجمات)
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 دقيقة
  },
  // سياسة إعادة محاولة الدفع
  PAYMENT_RETRY: {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 دقائق
  },
} as const;

/**
 * دالة للتحقق من معدل الطلبات
 * @param userId معرف المستخدم أو الـ IP
 * @param policy اسم السياسة
 * @returns true إذا كان الطلب مسموح
 */
export function checkRateLimit(
  userId: string,
  policy: keyof typeof RATE_LIMIT_POLICIES
): boolean {
  // الحصول على السياسة
  const { maxRequests, windowMs } = RATE_LIMIT_POLICIES[policy];

  // الحصول على بيانات المستخدم
  const key = `${userId}:${policy}`;
  const data = rateLimitStore.get(key);
  const now = Date.now();

  // إذا كان المستخدم محظور
  if (data?.blockedUntil && now < data.blockedUntil) {
    return false;
  }

  // إذا لم يكن لدينا بيانات، إنشاء جديدة
  if (!data) {
    rateLimitStore.set(key, {
      timestamps: [now],
      blockedUntil: 0,
    });
    return true;
  }

  // تنظيف الطلبات القديمة
  const recentTimestamps = data.timestamps.filter((ts) => now - ts < windowMs);

  // إذا كان عدد الطلبات أقل من الحد المسموح
  if (recentTimestamps.length < maxRequests) {
    recentTimestamps.push(now);
    rateLimitStore.set(key, {
      timestamps: recentTimestamps,
      blockedUntil: 0,
    });
    return true;
  }

  // إذا تجاوز الحد المسموح، حظر المستخدم
  const blockedUntil = now + windowMs;
  rateLimitStore.set(key, {
    timestamps: recentTimestamps,
    blockedUntil,
  });

  return false;
}

/**
 * دالة للحصول على الوقت المتبقي قبل إزالة الحظر
 * @param userId معرف المستخدم
 * @param policy اسم السياسة
 * @returns الوقت بالثواني أو 0 إذا لم يكن محظور
 */
export function getRateLimitRemainingTime(
  userId: string,
  policy: keyof typeof RATE_LIMIT_POLICIES
): number {
  const key = `${userId}:${policy}`;
  const data = rateLimitStore.get(key);

  if (!data?.blockedUntil) {
    return 0;
  }

  const now = Date.now();
  const remaining = Math.max(0, data.blockedUntil - now);

  return Math.ceil(remaining / 1000); // تحويل إلى ثواني
}

/**
 * دالة للمسح التدريجي للذاكرة
 * يجب استدعاؤها دورياً لتجنب تسرب الذاكرة
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // حذف المدخلات القديمة
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.timestamps.length === 0 && data.blockedUntil < oneHourAgo) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * دالة لإعادة تعيين الحد للمستخدم (للإدارة فقط)
 */
export function resetRateLimit(userId: string): void {
  const keysToDelete: string[] = [];

  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => rateLimitStore.delete(key));
}

/**
 * دالة للحصول على إحصائيات الحد
 */
export function getRateLimitStats(
  userId: string,
  policy: keyof typeof RATE_LIMIT_POLICIES
) {
  const key = `${userId}:${policy}`;
  const data = rateLimitStore.get(key);
  const now = Date.now();
  const { windowMs } = RATE_LIMIT_POLICIES[policy];

  if (!data) {
    return {
      requestsInWindow: 0,
      maxRequests: RATE_LIMIT_POLICIES[policy].maxRequests,
      windowMs,
      isBlocked: false,
      remainingSeconds: 0,
    };
  }

  const recentTimestamps = data.timestamps.filter((ts) => now - ts < windowMs);
  const isBlocked = data.blockedUntil && now < data.blockedUntil;
  const remainingSeconds = isBlocked
    ? Math.ceil((data.blockedUntil - now) / 1000)
    : 0;

  return {
    requestsInWindow: recentTimestamps.length,
    maxRequests: RATE_LIMIT_POLICIES[policy].maxRequests,
    windowMs,
    isBlocked: isBlocked || false,
    remainingSeconds,
  };
}
