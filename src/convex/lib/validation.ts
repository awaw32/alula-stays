/**
 * دالات التحقق من صحة البيانات
 * معايير أمان قوية لجميع المدخلات الحساسة
 */

const DAY_MS = 1000 * 60 * 60 * 24;
const MAX_BOOKING_NIGHTS = 365;
const MAX_GUESTS = 20;
const MIN_PRICE = 1;
const MAX_PRICE = 1_000_000; // ريال

/**
 * التحقق من صحة تواريخ الحجز
 */
export function validateBookingDates(checkIn: number, checkOut: number) {
  // التحقق من أن التواريخ أرقام صحيحة
  if (!Number.isFinite(checkIn) || !Number.isFinite(checkOut)) {
    throw new Error("تواريخ الحجز يجب أن تكون أرقام صحيحة");
  }

  const now = Date.now();

  // التحقق من أن تاريخ الوصول ليس في الماضي
  if (checkIn < now) {
    throw new Error("تاريخ الوصول يجب أن يكون في المستقبل");
  }

  // التحقق من أن تاريخ المغادرة بعد الوصول
  if (checkOut <= checkIn) {
    throw new Error("تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول");
  }

  // حساب عدد الليالي
  const nights = Math.ceil((checkOut - checkIn) / DAY_MS);

  // التحقق من أن الحجز ليلة على الأقل
  if (nights < 1) {
    throw new Error("يجب أن يكون الحجز ليلة واحدة على الأقل");
  }

  // التحقق من أن الحجز ليس طويل جداً
  if (nights > MAX_BOOKING_NIGHTS) {
    throw new Error(`لا يمكن حجز أكثر من ${MAX_BOOKING_NIGHTS} ليلة`);
  }

  return nights;
}

/**
 * التحقق من صحة عدد الضيوف
 */
export function validateGuests(guests: number, maxGuests: number): void {
  if (!Number.isInteger(guests) || guests < 1) {
    throw new Error("عدد الضيوف يجب أن يكون رقم صحيح موجب");
  }

  if (guests > MAX_GUESTS) {
    throw new Error(`عدد الضيوف الأقصى هو ${MAX_GUESTS}`);
  }

  if (guests > maxGuests) {
    throw new Error(
      `هذه الشقة تسع ${maxGuests} ضيف فقط، وليس ${guests}`
    );
  }
}

/**
 * التحقق من صحة السعر
 */
export function validatePrice(price: number): void {
  if (!Number.isFinite(price)) {
    throw new Error("السعر يجب أن يكون رقم صحيح");
  }

  if (price < MIN_PRICE) {
    throw new Error(`السعر يجب أن يكون على الأقل ${MIN_PRICE}`);
  }

  if (price > MAX_PRICE) {
    throw new Error(`السعر يجب أن لا يتجاوز ${MAX_PRICE}`);
  }
}

/**
 * التحقق من صحة نسبة الرسوم
 */
export function validateFeePercentage(percentage: number): void {
  if (!Number.isFinite(percentage)) {
    throw new Error("نسبة الرسوم يجب أن تكون رقم");
  }

  if (percentage < 0 || percentage > 100) {
    throw new Error("نسبة الرسوم يجب أن تكون بين 0 و 100");
  }
}

/**
 * التحقق من صحة مفتاح الأمان (API Key)
 */
export function validateApiKey(key: string | undefined, keyName: string): string {
  if (!key || key.trim() === "") {
    throw new Error(
      `خطأ في التكوين: ${keyName} غير محدد. تأكد من ملف البيئة`
    );
  }

  return key.trim();
}

/**
 * التحقق من صحة رابط الويب
 */
export function validateUrl(url: string | undefined, urlName: string): string {
  if (!url || url.trim() === "") {
    throw new Error(
      `خطأ في التكوين: ${urlName} غير محدد. تأكد من ملف البيئة`
    );
  }

  try {
    // محاولة إنشاء URL للتحقق من صحتها
    new URL(url.trim());
    return url.trim().replace(/\/$/, ""); // إزالة الـ trailing slash
  } catch {
    throw new Error(`${urlName} ليس رابط صحيح`);
  }
}
