/**
 * دوال معالجة وتنسيق أرقام الجوال للمصادقة وللرسائل القصيرة
 */

/**
 * توحيد رقم الجوال السعودي أو الدولي إلى صيغة قياسية E.164
 * يقبل: 0512345678, 512345678, 966512345678, +966512345678
 * يُرجع: +966512345678
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim().replace(/[^\d+]/g, "");

  // تحويل الأرقام العربية إلى الإنجليزية
  cleaned = cleaned.replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // معالجة الأصفار والبادئة السعودية
  if (cleaned.startsWith("00966")) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.startsWith("966")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("05") && cleaned.length === 10) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith("0") && cleaned.length > 9) {
    cleaned = cleaned.slice(1);
  }

  // إذا كان رقماً سعودياً (يبدأ بـ 5 وطوله 9 أرقام)
  if (cleaned.startsWith("5") && cleaned.length === 9) {
    return `+966${cleaned}`;
  }

  // لأي رقم دولي مكتمل
  if (cleaned.length >= 10) {
    return `+${cleaned}`;
  }

  // افتراض سعودي إن بدأ بـ 5
  if (cleaned.startsWith("5")) {
    return `+966${cleaned}`;
  }

  return `+966${cleaned}`;
}

/**
 * التحقق من صحة رقم الجوال السعودي
 * يجب أن يبدأ بـ +9665 ومتبوعاً بـ 8 أرقام (إجمالي 9 أرقام بعد رمز الدولة)
 */
export function isValidSaudiPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+9665\d{8}$/.test(normalized);
}

/**
 * تنسيق الرقم للعرض الجميل (مثال: +966 50 123 4567)
 */
export function formatPhoneDisplay(phone: string): string {
  const norm = normalizePhone(phone);
  if (/^\+9665\d{8}$/.test(norm)) {
    const p = norm.slice(4); // 5xxxxxxxx
    return `+966 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
  }
  return norm;
}
