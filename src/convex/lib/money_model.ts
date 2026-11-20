/**
 * الثوابت المالية للمنصة — مصدر الحقيقة الوحيد
 * ---------------------------------------------------------------
 * ⚠️ لا تحسب رسوم المنصة يدوياً في أي مكان آخر.
 *    استخدم هذه الدوال دائماً حتى لا تتكرر أخطاء الخصم المزدوج.
 *
 * ── النموذج المالي المعتمد ──────────────────────────────────────
 *   ما يدفعه الضيف   = totalPrice + platformFee
 *   (totalPrice  = سعر الإقامة لأيام المبيت)
 *   (platformFee = رسوم خدمة المنصة، تُضاف فوق سعر الإقامة)
 *
 *   ما يستلمه المالك  = totalPrice  (الإقامة كاملة)
 *   ما تحتفظ به المنصة = platformFee  فقط (نسبة واحدة، لا مرتين)
 *
 *   أي حساب يستخدم (totalPrice − platformFee) للمالك يُنشئ خصماً
 *   مزدوجاً يجعل المنصة تحتفظ بضعف الرسوم (~20% بدل 10%).
 */

import { calculatePlatformFee } from "./money";

/** نسبة رسوم خدمة المنصة الموثّقة. */
export const PLATFORM_FEE_PERCENT = 10;

/** رسوم المنصة لحجز معيّن. */
export function feeForBooking(totalPrice: number): number {
  return calculatePlatformFee(totalPrice, PLATFORM_FEE_PERCENT);
}

/** المبلغ النهائي الذي يدفعه الضيف = الإقامة + رسوم الخدمة. */
export function guestTotalFor(totalPrice: number): number {
  return Math.round(totalPrice + feeForBooking(totalPrice));
}

/** المبلغ الذي يستلمه المالك = سعر الإقامة كاملاً (الرسوم تُقتطع من الضيف فقط). */
export function ownerPayoutFor(totalPrice: number): number {
  return Math.round(totalPrice);
}
