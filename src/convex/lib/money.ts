/**
 * معالجة آمنة للعملات والأسعار
 * لتجنب أخطاء التقريب والقيم الخاطئة
 */

/**
 * حساب السعر الإجمالي بدقة
 * يتحقق من القيم الخاطئة والقيم السالبة
 */
export function calculateTotalPrice(
  nights: number,
  pricePerNight: number
): number {
  // التحقق من أن الليالي رقم صحيح موجب
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("عدد الليالي يجب أن يكون رقم صحيح موجب");
  }

  // التحقق من السعر
  if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
    throw new Error("سعر الليلة الواحدة يجب أن يكون رقم موجب");
  }

  // حساب السعر الإجمالي
  const total = nights * pricePerNight;

  // التحقق من أن النتيجة رقم صحيح محدود
  if (!Number.isFinite(total)) {
    throw new Error("حدث خطأ في حساب السعر الإجمالي");
  }

  // تقريب لأقرب ريال (العملات لا تقبل أجزاء من الريال)
  return Math.round(total);
}

/**
 * حساب رسوم المنصة
 * الرسوم = السعر × النسبة المئوية
 */
export function calculatePlatformFee(
  totalPrice: number,
  feePercentage: number = 10
): number {
  // التحقق من السعر
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    throw new Error("السعر الإجمالي يجب أن يكون موجب");
  }

  // التحقق من النسبة المئوية
  if (!Number.isFinite(feePercentage) || feePercentage < 0 || feePercentage > 100) {
    throw new Error("نسبة الرسوم يجب أن تكون بين 0 و 100");
  }

  // حساب الرسوم
  const fee = (totalPrice * feePercentage) / 100;

  // تقريب لأقرب ريال
  return Math.round(fee);
}

/**
 * حساب المبلغ النهائي المستحق
 */
export function calculateTotalAmount(
  totalPrice: number,
  platformFee: number
): number {
  // التحقق من القيم
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    throw new Error("السعر الإجمالي يجب أن يكون موجب");
  }

  if (!Number.isFinite(platformFee) || platformFee < 0) {
    throw new Error("رسوم المنصة يجب أن تكون موجبة أو صفر");
  }

  const total = totalPrice + platformFee;

  // التحقق من أن النتيجة صحيحة
  if (!Number.isFinite(total)) {
    throw new Error("حدث خطأ في حساب المبلغ الإجمالي");
  }

  return Math.round(total);
}

/**
 * تحويل الريال إلى أصغر وحدة (هللة)
 * Stripe يتطلب القيمة بأصغر وحدة
 * الريال السعودي = 100 هللة
 */
export function convertToSmallestUnit(riyal: number): number {
  if (!Number.isFinite(riyal) || riyal < 0) {
    throw new Error("المبلغ يجب أن يكون موجب");
  }

  const halalah = Math.round(riyal * 100);

  if (!Number.isFinite(halalah)) {
    throw new Error("حدث خطأ في تحويل المبلغ");
  }

  if (halalah <= 0) {
    throw new Error("المبلغ يجب أن يكون أكثر من صفر");
  }

  return halalah;
}

/**
 * التحقق من أن المبلغ الذي تم دفعه يطابق المتوقع
 */
export function verifyPaymentAmount(
  expectedAmount: number,
  actualAmount: number,
  tolerancePercentage: number = 1
): boolean {
  if (
    !Number.isFinite(expectedAmount) ||
    !Number.isFinite(actualAmount) ||
    expectedAmount <= 0 ||
    actualAmount <= 0
  ) {
    throw new Error("المبالغ يجب أن تكون صحيحة وموجبة");
  }

  // حساب نسبة الفرق
  const difference = Math.abs(expectedAmount - actualAmount);
  const percentageDiff = (difference / expectedAmount) * 100;

  // إذا كان الفرق أكثر من النسبة المسموحة، رفع الخطأ
  if (percentageDiff > tolerancePercentage) {
    throw new Error(
      `المبلغ المدفوع (${actualAmount}) لا يطابق المبلغ المتوقع (${expectedAmount})`
    );
  }

  return true;
}

/**
 * حساب استرجاع الأموال بناءً على سياسة الإلغاء
 */
export function calculateRefund(
  totalPrice: number,
  platformFee: number,
  hoursUntilCheckIn: number
): {
  refundPercentage: number;
  refundAmount: number;
  feeRefund: number;
} {
  // التحقق من القيم
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    throw new Error("السعر الإجمالي يجب أن يكون موجب");
  }

  if (!Number.isFinite(platformFee) || platformFee < 0) {
    throw new Error("رسوم المنصة يجب أن تكون موجبة أو صفر");
  }

  if (!Number.isFinite(hoursUntilCheckIn)) {
    throw new Error("الوقت المتبقي يجب أن يكون رقم");
  }

  // سياسة الإلغاء
  let refundPercentage = 0;
  if (hoursUntilCheckIn >= 72) {
    refundPercentage = 100; // إلغاء كامل بعد 3 أيام
  } else if (hoursUntilCheckIn >= 24) {
    refundPercentage = 50; // استرجاع نصف المبلغ بعد يوم
  } else {
    refundPercentage = 0; // لا استرجاع قبل 24 ساعة
  }

  // حساب مبالغ الاسترجاع
  const refundAmount = Math.round((totalPrice * refundPercentage) / 100);
  const feeRefund = refundPercentage === 100 ? platformFee : 0;

  return { refundPercentage, refundAmount, feeRefund };
}
