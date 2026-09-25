# دليل مطوّر مشروع Alula Stays — شقق العلا

> هذا الملف يشرح للمبرمج الجديد أين وصل المشروع، وما الموجود في كل مكان،
> وأين يتوجه بالتحديد عند أي تعديل. اقرأه قبل تغيير أي شيء.

---

## 1) نظرة عامة ومرحلة الإنجاز

تطبيق ويب لحجز الشقق الفندقية في العلا (تنسيق مشابه لفريم Airbnb):

- المستأجر/الضيف: تصفح الشقق، التفاصيل، الحجز (تواريخ/أسعار/رسوم منصة)، المفضلة.
- المالك: أول تسجيل → استمارة بيانات (اسم/جوال) → لوحة مالك → يضيف شققاً **بانتظار مراجعة الأدمن**.
- الأدمن: قبول/رفض الشقق قبل ظهورها للعموم، تمييز الشقق، إدارة أدوار المستخدمين، إحصائيات.

**خلص حالياً**: كل الروابط الخلفية والواجهة تعمل في بيئة الإنتاج الفعلية
(Convex Production + استضافة Namecheap + نطاق `soqaqalaula.world`).

### قنوات التشغيل الثلاث (يجب أن تبقى مطابقة)
| القناة | المكان | الحالة |
|---|---|---|
| المحلي (الأساسي) | مجلد المشروع هذا (OneDrive) | مصدر الحقيقة |
| GitHub | `https://github.com/awaw32/alula-stays.git` (فرع `main`) | يجب أن يطابق المحلي دائماً |
| الاستضافة | `soqaqalaula.world` عبر FTP (الجذر `/`) | تخدم `dist/` المبنية من المحلي |

> انظر قسماً 6 «قواعد ذهبية» و7 «دليل النشر».

---

## 2) التقنيات والبنية

| الطبقة | التقنية | ملاحظات |
|---|---|---|
| الواجهة | React 19 + TypeScript + Vite 7 | `src/` |
| التوجيه | react-router v7 | `src/main.tsx` |
| الخلفية | Convex (قاعدة بيانات + دالة backend) | `src/convex/*`، Deployment: `wry-mosquito-572` |
| المصادقة | `@convex-dev/auth` — تسجيل دخول برمز OTP عبر البريد | JWKS/JWT من freebuff (راجع 5) |
| الأنماط | Tailwind + تصميم Claymorphism (ارتفاعات/ظلال مطاطية) | متغيرات CSS `--clay-*` في `src/index.css` |
| الحالة/البيانات | `@convex-dev/auth/react` + `convex/react` | hooks: `useAuth`, `useQuery`, `useMutation` |

**مهم**: التطبيق **عربي RTL بالكامل**. لا تغيّر الاتجاه ولا أسلوب التصميم.

---

## 3) خريطة الأماكن المهمة (أين تذهب لأي تعديل)

### 3.1 التوجيه والصفحات
| ماذا | أين |
|---|---|
| كل المسارات وحمايتها | `src/main.tsx` — lazy لكل صفحة + `RequireAuth`/`RequireRole` |
| أشكال الحماية (`RequireAuth`, `RequireRole`) | `src/components/RequireAuth.tsx` |
| الصفحة الرئيسية | `src/pages/Landing.tsx` |
| تسجيل الدخول / بوابة المالك | `src/pages/Auth.tsx` — معامل `?owner=1` يجعل التوجيه بعد OTP إلى `/owner/profile` |
| لوحة المستخدم العادي | `src/pages/Dashboard.tsx` |
| قائمة الشقق + التفاصيل | `src/pages/Apartments.tsx` , `src/pages/ApartmentDetail.tsx` |
| لوحة المالك | `src/pages/OwnerDashboard.tsx` |
| استمارة بيانات المالك (أول تسجيل) | `src/pages/OwnerProfile.tsx` — جديدة |
| إضافة/تعديل شقة | `src/pages/AddApartment.tsx` , `src/pages/EditApartment.tsx` |
| لوحة الأدمن | `src/pages/AdminDashboard.tsx` |
| حجوزاتي | `src/pages/MyBookings.tsx` |
| شريط التنقل | `src/components/Navigation.tsx` — حساب المسار حسب الدور |

### 3.2 المصادقة والأدوار
| ماذا | أين |
|---|---|
| Hook المصادقة (user/role/isAuthenticated) | `src/hooks/use-auth.ts` (يستدعي `api.users.currentUser`) |
| أنواع الأدوار (`user/owner/admin/member`) | `src/convex/schema.ts` `RULES`/`roleValidator` — **لا تحذف** |
| دوال الحماية الخلفية | `src/convex/lib/authorization.ts` (`requireUser`, `requireRole`, `requireAnyRole`, `requireApartmentOwner`, `requireBookingAccess`) |
| إدارة الحساب/الترقية | `src/convex/users.ts` — `currentUser`, `becomeOwner`, `myProfile`, `updateProfile` |
| التحقق من بريد OTP | `@convex-dev/auth` + إعدادات JWT (قسم 5) |

### 3.3 خلفية Convex (جدول → ملف)
| الجدول/الموضوع | الملف |
|---|---|
| `users`, `apartments`, `reviews`, `bookings`, `favorites`, `userProfiles`, `apartmentImages`, `notifications`, ... | `src/convex/schema.ts` (تعريف الجداول والحقول والفهارس) |
| الشقق (قوائم عامة مع فلترة التوثيق) | `src/convex/apartments.ts` — `list/get/featured/locations/stats` |
| شقق المالك + قبول/رفض الأدمن | `src/convex/admin.ts` — `ownerApartments`, `createApartment` (ترقية تلقائية لمالك), `adminVerifyApartment`, `adminFeatureApartment`, `adminUpdateUserRole`, `allApartments`, `allUsers`, `adminDashboardStats`, `deleteApartment` |
| الحجوزات (إنشاء/تحقق تعارض/ملكية) | `src/convex/bookings.ts` — فيه تحصينات: رفض شقة غير موثقة، رفض حجز المالك على شقته |
| الصور والملفات | `src/convex/images.ts` — `generateUploadUrl`, `saveApartmentImage`, `getApartmentImages`, `deleteImage`, صور الملف الشخصي |
| أدوات مساعدة لتوليد البيانات/سجلات | `src/convex/seed*.ts`, `analytics.ts`, `email.ts`, `errors.ts`, `rateLimit.ts`, `money.ts`, `validation.ts` |

### 3.4 مكونات الواجهة المهمة
| المكوّن | أين |
|---|---|
| نموذج الشقة (مع **رفع صور من الجهاز**) | `src/components/apartments/ApartmentForm.tsx` — يرفع عبر `api.images.generateUploadUrl` + تخزين Convex، أو لصق رابط |
| بطاقة الشقة | `src/components/apartments/ApartmentCard.tsx` |
| مربعات حوار التأكيد | `src/components/ConfirmDialog.tsx` |
| مكونات UI (زر، مدخل، بطاقة...) | `src/components/ui/*` |

### 3.5 ملفات النشر والاستضافة
| الملف | الدور |
|---|---|
| `scripts/deploy-ftp.mjs` | يرفع `dist/` إلى جذر الاستضافة (يبني .htaccess تلقائياً لو غاب) |
| `public/.htaccess` | SPA fallback + ضغط + كاش (يُنسخ إلى `dist/`) |
| `public/robots.txt` , `public/sitemap.xml` | سي آر أو وإن دكس |
| `.github/workflows/deploy.yml` | نشر تلقائي إلى Cloudflare Pages (يستخدم **Bun**) |
| `.github/workflows/deploy-pages.yml` | نشر تلقائي إلى GitHub Pages |
| `.env.ftp` (gitignored) | بيانات FTP — **سرّ، لا ترفعه** |
| `.env.local` (gitignored) | متغيرات Convex المحلية (`CONVEX_DEPLOYMENT=dev`، `VITE_CONVEX_URL=localhost`) — تجاوزها عند النشر |

---

## 4) التدفقات الرئيسية (كيف تعمل)

### 4.1 تدفق المالك (أهم ما طُلب أخيراً)
1. «تسجيل دخول مالك عقار» في صفحة الدخول → `/auth?owner=1` → تسجيل بريد → كود OTP ✅.
2. عند نجاح التحقق يُوجَّه إلى **`/owner/profile`** (استمارة الاسم/الجوال/المدينة/البلد).
   - الصفحة ترفّع الدور تلقائياً إلى `owner` (عبر `becomeOwner`) إذا كان `user`.
   - إذا اكتمل الملف مسبقاً ودوره `owner/admin` ينقل للمالك للوحة `/owner`.
3. الحفظ (`updateProfile`) → يكتب الاسم في `users` والجوال في `userProfiles` → ينتقل إلى `/owner`.
4. لوحة المالك عرض: الاحصائيات، تبويب «شققي» مع زر «إضافة شقة» دائم، حالة كل شقة (منشورة/بانتظار المراجعة)، وتبويب الحجوزات.
5. إضافة شقة (`/owner/add` محمية بـ `RequireAuth` فقط، لا `RequireRole`) → استمارة تتضمن زر «رفع الصور من جهازك».
   - الوصول إليها بدور غير مكتمل الملف → يردّ إلى `/owner/profile` (حارس داخل الصفحة).
6. `createApartment` (خلفي): يجعل الشقة `isVerified: false`، ويرقّي أتوماتيكياً أي مستخدم مسجّل إلى `owner` لو لازم.
7. **الظهور**: `src/convex/apartments.ts` يخفي غير الموثقة عن الزوار والمستأجرين (`list`, `get`, `featured`, `locations`, `stats`).

### 4.2 تدفق قبول/رفض الأدمن
- الأدمن من `/admin` تبويب «الشقق» يرى كل الشقق (الموثقة وغير الموثقة).
- زر **«قبول»** → `adminVerifyApartment(verified=true)` → `isVerified=true` → تظهر للعموم فوراً.
- زر **«رفض»** → `verified=false` → تختفي/تبقى مخفية.
- مؤشر «بانتظار التوثيق» في بطاقات الإحصائيات يحسب من `adminDashboardStats`.

### 4.3 تدفق الحجز (مختصر)
- الضيف يفتح الشقة → يحجز تواريخ → `bookings.create` يتحقق من التعارض (التواريخ الحرة) ومن أن الشقة موثقة.
- خطوات إضافية: `checkAvailability`، تأكيد/إلغاء من قبل الأدمن أو صاحب الشقة، رسوم منصة `platformFee` (10%).
- **تحصين أُضيف**: لا يمكن حجز شقة غير موثقة، ولا يمكن للمالك حجز شقته بنفسه (`APARTMENT_NOT_VERIFIED`, `APARTMENT_OWN_BOOKING` في `errors.ts`).

---

## 5) الإعدادات والأسرار (لا تُرفع لـ GitHub)

| العنصر | أين | ملاحظة |
|---|---|---|
| بيانات FTP | `.env.ftp` | تستخدمها `deploy-ftp.mjs` فقط |
| متغيرات Convex المحلية | `.env.local` | `CONVEX_DEPLOYMENT` / `VITE_CONVEX_URL` |
| بيانات Convex الإنتاج | لوحة Convex dashboard | `JWKS`, `JWT_PRIVATE_KEY` (سر), `JWT_PUBLIC_KEY`, `SITE_URL=https://soqaqalaula.world`, `VLY_CONVEX_AUTH_ISSUER=https://freebuff.com` |
| تسجيل دخول Convex CLI | `~/.convex/config.json` | accessToken شخصي |

**تذكير**: إدارة الحزم الموحّدة = **Bun** (`bun.lock` متتبع). `package-lock.json` **مُستبعد** من git (في `.gitignore`) وتُرّك محلياً فقط للنوافذ (npm).

---

## 6) قواعد ذهبية عند التعديل (لا تُخالفها)

1. **لا تعدّل** `src/convex/schema.ts` — لا تحذف/تعيد تسمية جدولاً أو حقلاً أو فهرساً. الإضافة المسموح بها فقط: حقول `v.optional(...)` جديدة داخل جدول قائم.
2. **لا تغيّر** أسماء دوال Convex ولا معاملاتها ولا أنواعها — الواجهة والـ bindings (`_generated`) تعتمد عليها. إضافة دوال جديدة مسموحة.
3. **لا تغيّر** التصميم/الاتجاه (RTL) ولا ملفات `dist/` يدوياً ولا Base paths في `vite.config`.
4. **لا ترفع أسراراً**: `.env.*`، `_generated/` في gitignore. لا تضع كلمة مرور/توكن في كود يُلتزم.
5. `_generated/` مولّدة وليست متعقبة بغيت — بعد تغيير Convex نفّذ:
   ```bash
   $env:CONVEX_DEPLOYMENT="wry-mosquito-572"; npx convex codegen --typecheck disable
   ```
6. على ويندوز، `npm.ps1` محجوب بحزمة Execution Policy — استخدم `cmd /c "npm ... 2>&1"` أو `npx.cmd`.
7. بعد تعديل خلفي أو واجهة يجب إعادة النشر (قسم 7) كي يصبح المحلي = GitHub = الاستضافة.

---

## 7) دليل النشر خطوة بخطوة (يعمل الآن)

```powershell
# 1) توليد bindings للخلفية (مطلوب بعد تعديل convex)
$env:CONVEX_DEPLOYMENT="wry-mosquito-572"
npx convex codegen --typecheck disable

# 2) نشر الخلفية إلى Production
npx convex deploy --typecheck disable

# 3) بناء الواجهة مع رابط الإنتاج (لا تنسَ تجاوز .env.local)
$env:VITE_CONVEX_URL="https://wry-mosquito-572.convex.cloud"
cmd /c "npm run build"

# 4) رفع dist/ إلى الاستضافة (يقرأ .env.ftp)
node scripts/deploy-ftp.mjs

# 5) التزام وتفريغ إلى GitHub
git add -A
git commit -m "وصف التغيير"
git push origin main
```

---

## 8) أعمال مكتملة مؤخراً (ملخص التغييرات الأخيرة)

1. **حماية الحجوزات**: رفض حجز شقة غير موثقة، ومنع المالك من حجز شقته (خلفي + رسائل أخطاء).
2. **إدارة أحادي للحزم**: استبقاء `bun.lock` (CI يعتمد عليه)، واستبعاد `package-lock.json`.
3. **موارد الاستضافة/SEO**: `.htaccess`, `robots.txt`, `sitemap.xml` أُضيفت وأُعيد رفعها.
4. **إصلاح بوابة المالك**: تدفق `becomeOwner` أصبح يعمل للمستخدم الجديد (كان يعيده للوحة المستخدم).
5. **تدفق المالك الكامل**: استمارة بيانات أولية + لوحة مالك متكاملة + توجيه سليم بعد OTP.
6. **رفع الصور**: زر «رفع الصور من جهازك» في نموذج الشقة عبر تخزين Convex.
7. **وضوح قبول/رفض الأدمن**: أزرار لوحة الإدارة أصبحت «قبول» / «رفض».
8. **مزامنة القنوات**: المحلي = GitHub = الاستضافة (تحقق بايت-بايت).

---

## 9) ملاحظات ومهام مستقبلية محتملة

- لا يوجد **نظام دفع حقيقي** — حالة `paymentStatus` وهمية/يدوية حالياً.
- ضغط الصور عند الرفع (قياس/تحويل) غير مفعّل بعد (لا يوجد نظام رفع أُضيف سابقاً لواجهة عامة) — `apartmentImages`/`saveApartmentImage` جاهزة كبنية لكن الواجهة الحالية ترفع مباشرة إلى `apartments.images` كروابط.
- `alulastay.com` لا يزال (GoDaddy parking) — النطاق الفعّال `soqaqalaula.world`.
- الترقيب المستقبلي: إشعارات، مراجعات، دفع.