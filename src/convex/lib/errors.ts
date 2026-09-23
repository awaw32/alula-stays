/**
 * معالجة الأخطاء الموحدة
 * رسائل أخطاء ثابتة وموثوقة
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} غير موجود`);
    this.name = "NotFoundError";
  }
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

export class RateLimitError extends Error {
  constructor() {
    super("تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى لاحقاً");
    this.name = "RateLimitError";
  }
}

/**
 * رسائل خطأ موحدة
 */
export const ERROR_MESSAGES = {
  // المصادقة والتفويض
  MUST_LOGIN: "يجب تسجيل الدخول أولاً",
  UNAUTHORIZED: "ليس لديك صلاحية للقيام بهذا الإجراء",
  BOOKING_NOT_YOURS: "لا يمكنك الوصول إلى هذا الحجز",
  PAYMENT_NOT_YOURS: "لا يمكنك دفع حجز ليس لك",

  // الشقق
  APARTMENT_NOT_FOUND: "الشقة غير موجودة",
  APARTMENT_UNAVAILABLE: "الشقة غير متاحة حالياً",

  // الحجوزات
  BOOKING_NOT_FOUND: "الحجز غير موجود",
  BOOKING_DATES_UNAVAILABLE: "التواريخ المطلوبة غير متاحة",
  BOOKING_STATUS_INVALID: "لا يمكن تنفيذ هذا الإجراء على هذا الحجز",
  BOOKING_CANNOT_CANCEL: "لا يمكن إلغاء هذا الحجز",
  BOOKING_CANNOT_CONFIRM: "لا يمكن تأكيد هذا الحجز",

  // الدفع
  PAYMENT_INVALID_AMOUNT: "قيمة الحجز غير صالحة",
  PAYMENT_SESSION_INVALID: "جلسة الدفع غير صالحة",
  PAYMENT_AMOUNT_MISMATCH: "المبلغ المدفوع لا يطابق الحجز",
  PAYMENT_ALREADY_PAID: "تم دفع هذا الحجز بالفعل",
  PAYMENT_METADATA_MISMATCH: "بيانات جلسة الدفع لا تطابق الحجز",

  // الأمان والتكوين
  CONFIG_STRIPE_KEY_MISSING:
    "خطأ في التكوين: STRIPE_SECRET_KEY غير محدد",
  CONFIG_STRIPE_KEY_INVALID:
    "خطأ في التكوين: STRIPE_SECRET_KEY غير صحيح",
  CONFIG_APP_URL_MISSING:
    "خطأ في التكوين: رابط التطبيق غير محدد",
  CONFIG_APP_URL_INVALID:
    "خطأ في التكوين: رابط التطبيق غير صحيح",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى لاحقاً",
} as const;

/**
 * دالة للتحقق من وجود مورد
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string
): T {
  if (!resource) {
    throw new NotFoundError(resourceName);
  }
  return resource;
}

/**
 * معالج الأخطاء الموحد
 * يحول الأخطاء إلى رسائل ودية
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof AuthorizationError) {
    return error.message;
  }

  if (error instanceof NotFoundError) {
    return error.message;
  }

  if (error instanceof PaymentError) {
    return error.message;
  }

  if (error instanceof RateLimitError) {
    return error.message;
  }

  if (error instanceof Error) {
    // إذا كانت الرسالة من Stripe أو خدمة خارجية
    if (error.message.includes("Stripe")) {
      return "حدث خطأ أثناء معالجة الدفع. حاول مرة أخرى";
    }

    // إذا كانت رسالة واضحة، استخدمها
    if (
      error.message.startsWith("عدد") ||
      error.message.startsWith("تاريخ") ||
      error.message.startsWith("السعر") ||
      error.message.startsWith("تواريخ")
    ) {
      return error.message;
    }

    // رسالة عامة
    return "حدث خطأ غير متوقع. حاول مرة أخرى";
  }

  return "حدث خطأ غير متوقع";
}
