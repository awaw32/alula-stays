# شقق العلا (AlUla Stays) - Project Memory, Architecture & Execution Guidelines

## 1. نظرة عامة على المشروع
منصة حجز وإدارة شقق وإقامات فاخرة في العلا (AlUla Stays).
- **الرابط الإنتاجي (Production URL):** `https://alulahome.com`
- **الاستضافة:** Hostinger (Node.js Build & Deploy عبر Git Integration).
- **إدارة قواعد البيانات والمصادقة (Backend):** Convex (`src/convex`, Deployment: `prod:wry-mosquito-572`).

---

## 2. البنية التقنية (Tech Stack)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **UI Components:** Radix UI primitives, Lucide Icons (`lucide-react`), Framer Motion animations.
- **Backend & Database:** Convex (`convex.json`, `src/convex/`).
- **Auth (المصادقة):** `@convex-dev/auth` تدعم الدخول برقم الهاتف ورمز التحقق (SMS OTP عبر Infobip API مع Fallback فوري للتطوير في `src/convex/auth/phoneOtp.ts`).

---

## 3. الأوامر الأساسية (Windows Environment)
ملاحظة: في بيئة Windows PowerShell، استخدم دائماً صيغة `.cmd` للأدوات التنفيذية:
- **فحص الأنواع الصامت (TypeScript Check):** `npx.cmd tsc --noEmit`
- **البناء للإنتاج والتحقق من الجاهزية:** `npm.cmd run build`
- **تشغيل خادم التطوير:** `npm.cmd run dev`
- **نشر دوال ومخطط Convex:** `npx.cmd convex deploy`

---

## 4. قواعد العمل الصارمة والتنفيذ السريع (Zero-Regression & High Performance)

### أولاً: تنظيف وتصفية سياق العمل (Performance & Context Cleanliness)
- الحفاظ التام على استبعاد كافة الملفات الثقيلة والمؤقتة في `.gitignore` (`node_modules/`, `dist/`, `.vite/`, `*.log`, `.env*`).
- الحفاظ على مستودع Git نظيف وخفيف دائماً لتجنب البطء في المسح ومعالجة التغييرات.

### ثانياً: قواعد التعديل السريع والمحدد (Targeted Scoping)
1. **الاستهداف المباشر:** عند طلب تعديل في عنصر معين (مثل: بانر، بطاقة، نموذج)، يتم التوجه فوراً للمكون المسؤول في `src/components/` أو الصفحة المعنية في `src/pages/` دون مسح شجرة الملفات غير ذات الصلة.
2. **عدم إعادة كتابة الملفات بالكامل دون داعٍ:** تعديل الأسطر والمقاطع المعنية بالوظيفة أو التصميم فقط، مع الحفاظ على بقية منطق وتوابع الملف.
3. **منع كسر الكود القائم (Zero Regression):**
   - الحفاظ على تكامل قاعدة بيانات Convex الحالية ومخطط الجداول (`src/convex/schema.ts`).
   - الحفاظ على تكامل المصادقة وخدمات التحقق.
   - الحفاظ على التنسيقات العامة وأيقونات `lucide-react` دون استبدالها بمكتبات غير متوافقة.

### ثالثاً: دورة الفحص الذاتي التلقائي (Self-Healing Loop)
المطور الذكي مسؤول مسؤولية تامة عن سلامة الكود قبل تسليم العمل:
1. تشغيل `npx.cmd tsc --noEmit` للتأكد من خلو المشروع من أخطاء الـ TypeScript.
2. تشغيل `npm.cmd run build` للتأكد من نجاح تجميع الواجهة وخلوها من الاستيرادات المفقودة.
3. في حال ظهور أي خطأ، يتم إصلاحه ذاتياً وفورياً قبل إنهاء الرد للمستخدم.

### رابعاً: الاستفادة القصوى من الـ MCP وأدوات المحرر المدمجة
1. استخدام خوادم الـ MCP المتوفرة (Convex MCP, Hostinger MCP) لفحص الجداول والسجلات وحالة البناء.
2. استخدام الأوامر الطرفية المدمجة لتنفيذ المهام والاختبارات مباشرة دون تعطيل المستخدم.
