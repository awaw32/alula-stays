# شقق العلا (AlUla Stays) - Project Memory & Architecture Guide

## 1. نظرة عامة على المشروع
منصة حجز وإدارة شقق وإقامات في العلا (AlUla Stays).
- **الرابط الإنتاجي (Production URL):** `https://soqaqalaula.world`
- **الاستضافة:** Namecheap (مجلد الجذر الرئيسي عبر FTP).
- **إدارة قواعد البيانات والمصادقة (Backend):** Convex (`src/convex`).

## 2. البنية التقنية (Tech Stack)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **UI Components:** Radix UI primitives, Lucide Icons, Framer Motion animations.
- **Backend & Database:** Convex (`convex.json`, `src/convex/`).
- **Auth (المصادقة):** `@convex-dev/auth` تدعم الدخول برقم الهاتف ورمز التحقق (SMS OTP) عبر Infobip API (`src/convex/auth/phoneOtp.ts`).
- **Deploy:** سكربت نشر مخصص عبر FTPS / FTP Explicit (`scripts/deploy-ftp.mjs`) يرفع محتويات مجلد `dist/` مع ملف `.htaccess` لإدارة توجيهات الـ SPA والضغط والتخزين المؤقت.

## 3. الأوامر الأساسية (Windows Environment)
ملاحظة: في بيئة Windows PowerShell، استخدم دائماً صيغة `.cmd` للأدوات التنفيذية:
- **البناء للإنتاج:** `npm.cmd run build`
- **تشغيل خادم التطوير:** `npm.cmd run dev`
- **نشر الموقع عبر الـ FTP:** `node scripts/deploy-ftp.mjs`
- **مزامنة Convex:** `npx.cmd convex dev`

## 4. ملفات البيئة والإعدادات الحساسة
- `.env.local`: متغيرات التطوير المحلي (Convex URL، إلخ).
- `.env.production`: متغيرات الإنتاج الخاصة بالواجهة وConvex.
- `.env.ftp`: بيانات الاتصال بالاستضافة (FTP_HOST, FTP_USER, FTP_PASS, FTP_PORT). لا يتم رفعها للـ Git.

## 5. قواعد العمل وتفضيلات المستخدم
- العمل مباشرة وسرعة التنفيذ دون طلب استئذان روتيني متكرر.
- الحفاظ على سلامة الكود والملفات وعدم تخريب أي وظيفة قائمة.
- التأكد دائماً من نجاح البناء `npm.cmd run build` قبل أي عملية نشر.
