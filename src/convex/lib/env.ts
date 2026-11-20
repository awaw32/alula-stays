/**
 * كشف بيئة تشغيل دوال Convex
 * ---------------------------------------------------------------
 * الهدف: منع تشغيل الأدوات الحساسة (تسريب رموز التحقق، بوابة دفع وهمية،
 * ترقية أول مدير) في بيئة الإنتاج، مع بقائها تعمل أثناء التطوير حتى
 * لا تتعطل تجربة العمل اليومية.
 *
 * هذه الأدوات لا تُحذف — بل تُقيَّد فقط.
 * لتفعيلها صريحاً في أي بيئة:
 *     npx convex env set ALLOW_DEV_TOOLS true
 *
 * طريقة الكشف (بالترتيب):
 *  1) متغير صريح ALLOW_DEV_TOOLS=true  → يسمح في أي بيئة (opt-in).
 *  2) النشر الإنتاجي لـ Convex على نطاق *.convex.cloud → يُمنع.
 *     بيئات التطوير والمعاينة على *.convex.site → يُسمح.
 *  3) تعذّر تحديد النطاق → يُمنع (الوضع الآمن الافتراضي).
 *
 * ملاحظة مهمة لهذا المشروع تحديداً:
 * ‏CONVEX_DEPLOYMENT في .env.local يشير إلى نفس نشر الإنتاج
 * (wry-mosquito-572.convex.cloud)، أي أن "npx convex dev" و Hostinger
 * يعملان على قاعدة بيانات واحدة. لذلك لا يمكن الاعتماد على فحص النطاق
 * للتمييز بين التطوير والإنتاج، والتحكّم الفعلي هو المتغير الصريح:
 *
 *     npx convex env set ALLOW_DEV_TOOLS true      ← لفتح الأدوات
 *     npx convex env set ALLOW_DEV_TOOLS false     ← لإغلاقها (الوضع الافتراضي)
 */

export function isDevelopmentDeployment(): boolean {
  const override = String(process.env.ALLOW_DEV_TOOLS ?? "")
    .trim()
    .toLowerCase();

  if (override === "true") return true;
  if (override === "false") return false;

  const cloudUrl = String(process.env.CONVEX_CLOUD_URL ?? "")
    .trim()
    .toLowerCase();

  if (!cloudUrl) return false;
  if (cloudUrl.endsWith(".convex.cloud")) return false;
  if (cloudUrl.endsWith(".convex.site")) return true;

  return false;
}

/** رسالة موحّدة لا تكشف أي تفاصيل عن البيئة الداخلية. */
export const DEV_TOOLS_DISABLED_MESSAGE =
  "هذه الميزة مفعّلة في بيئة التطوير فقط ولا تتاح في بيئة الإنتاج.";
