/**
 * تسعير الإقامة — مشترك بين الواجهة والخلفية لضمان تطابق الحساب.
 *
 * ليلة نهاية الأسبوع: الليلة التي يبدأ فيها الإقامة يوم الخميس أو الجمعة
 * (عطلة نهاية الأسبوع في السعودية الجمعة-السبت، والليلة السياحية تبدأ مساء).
 * getDay(): 0=الأحد ... 4=الخميس، 5=الجمعة، 6=السبت.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

export const WEEKEND_DAYS = new Set([4, 5]); // الخميس والجمعة

export const DEFAULT_MIN_NIGHTS = 1;

/** بداية اليوم المحلي لطابع زمني */
export function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * تفريغ فترة إقامة [checkIn, checkOut) إلى ليالي فردية.
 * كل ليلة تُنسب لليوم الذي يبدأ فيه الإقامة فيها.
 */
export function enumerateNights(checkIn: number, checkOut: number): number[] {
  const nights: number[] = [];
  let night = startOfLocalDay(checkIn);
  const end = startOfLocalDay(checkOut);
  while (night < end) {
    nights.push(night);
    night += DAY_MS;
  }
  return nights;
}

/**
 * حساب إجمالي الإقامة مع سعر نهاية الأسبوع.
 * @param checkIn تاريخ الوصول (timestamp)
 * @param checkOut تاريخ المغادرة (timestamp)
 * @param basePrice سعر الليلة الأساسي
 * @param weekendPrice سعر ليلة نهاية الأسبوع — اختياري، يُستخدم إن كان أكبر من صفر
 * @returns تفصيل الليالي والإجمالي
 */
export function calculateStayPrice(
  checkIn: number,
  checkOut: number,
  basePrice: number,
  weekendPrice?: number,
): {
  totalNights: number;
  weekendNights: number;
  weekdayNights: number;
  pricePerNight: number; // السعر الفعلي المعتمد للحجز (الأساسي)
  totalPrice: number;
} {
  const nights = enumerateNights(checkIn, checkOut);
  const weekend = weekendPrice !== undefined && Number.isFinite(weekendPrice) && weekendPrice > 0;

  let total = 0;
  let weekendNights = 0;

  for (const night of nights) {
    const day = new Date(night).getDay();
    if (weekend && WEEKEND_DAYS.has(day)) {
      total += weekendPrice;
      weekendNights++;
    } else {
      total += basePrice;
    }
  }

  return {
    totalNights: nights.length,
    weekendNights,
    weekdayNights: nights.length - weekendNights,
    pricePerNight: basePrice,
    totalPrice: total,
  };
}

/** هل فترة الإقامة تحقق الحد الأدنى للليالي؟ */
export function meetsMinNights(
  checkIn: number,
  checkOut: number,
  minNights?: number,
): boolean {
  const min = minNights !== undefined && Number.isInteger(minNights) && minNights > 1
    ? minNights
    : DEFAULT_MIN_NIGHTS;
  const nights = enumerateNights(checkIn, checkOut).length;
  return nights >= min;
}
