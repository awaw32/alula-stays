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

## 4) التدفقات الرئيسية (محدثة سبتمبر 2026)

### 4.1 تدفق المالك
1. تسجيل دخول مالك عقار → `/auth?owner=1` → OTP → `/owner/profile`.
2. الحفظ → `/owner` (لوحة المالك).
3. لوحة المالك بها 4 تبويبات: **شققي** (شارات الحالة + سبب الرفض بالأحمر)، **الحجوزات** (ضيوف/عمولة/صافي مستحق)، **تقويم التوفر**، **المالية** (أرباح + IBAN + سجل تحويلات). وفوقها قسم **توثيق الهوية** (هوية/سجل تجاري ← مراجعة أدمن).

### 4.2 دورة حياة الشقة (النظام الجديد)
- حالات: `pending / approved / rejected / needs_changes / suspended` على حقل `apartments.status`.
- الأدمن من `/admin` تبويب الشقق: **قبول** مباشر، **رفض/طلب تعديلات/إيقاف** عبر نافذة **تفرض كتابة السبب**. يُحفظ `reviewNotes/reviewedBy/reviewedAt` ويُرسل إشعار للمالك.
- دالة موحدة `isApartmentLive()` (في admin.ts) تحدد "منشورة" — تدعم الشقق القديمة عبر `isVerified`.
- تعديل شقة مرفوضة يعيدها تلقائياً لـ pending؛ `resubmitApartment` لإعادة الإرسال.

### 4.3 التقويم والتسعير
- جدول `blockedDates`: حجب يدوي من المالك (صيانة/حظر) — ملف `src/convex/calendar.ts`.
- **منع تعارض مزدوج** في `bookings.create` و`checkAvailability`: حجوزات فعالة + تواريخ محجوبة (`overlapsBlockedDates`).
- **تسعير لكل ليلة**: `src/lib/pricing.ts` (مشترك واجهة/خلفية) — ليلة الخميس/الجمعة بسعر `weekendPrice`، والباقي بالأساسي + فحص `minNights`.
- تقويم 60 يوماً في لوحة المالك + الأيام غير المتاحة معروضة للضيف في صفحة الشقة (قسم قابل للطي).

### 4.4 الحجز والدفع
- `bookings.create`: تحقق كامل (تسجيل دخول، شقة approved، عدم حجز شقتك، سعر، تواريخ، ضيوف، تعارض، الحد الأدنى) ثم Stripe Checkout من الخادم (`payments.ts`).
- **Webhook**: `http.ts` على `/stripe-webhook` بتحقق توقيع — `checkout.session.completed` → `bookings.markPaid`، `expired` → `bookings.expireUnpaidSession` (إلغاء الحجز غير المدفوع).
- الاسترداد محسوب تلقائياً عند الإلغاء (100% قبل 24 ساعة / 50% / بلا) في `calculateRefund`.

### 4.5 الرسائل مالك ↔ ضيف
- ملف `src/convex/messages.ts` + جدولا `conversations/messages`.
- زر «مراسلة المالك» في صفحة الشقة → محادثة لكل (ضيف، شقة) → صفحة `/messages` للطرفين.
- **إخفاء الجوال**: `contactRevealed()` يكشف رقم المالك من `userProfiles` فقط عند وجود حجز confirmed/completed — تنبيه داخل المحادثة يوضح الحالة.

### 4.6 بلاغات وتوثيق هوية
- `reports.ts`: زر «إبلاغ ⚑» في صفحة الشقة → تبويب «البلاغات» بالأدمن (معالجة/تجاهل) — ضد السبام (بلاغ/ساعة).
- `identity.ts`: رفع هوية/سجل تجاري من لوحة المالك → تبويب «توثيق الهويات» بالأدمن (قبول يعلّم `userProfiles.identityVerified`).

### 4.7 إعدادات المنصة
- `settings.ts` + جدول `siteSettings` (سجل وحيد key="general").
- تبويب **«الإعدادات»** بالأدمن: البريد/الجوال/واتساب/إنستغرام/X/اسم العلامة + مزود الدفع/البريد/الخرائط — والرئيسية تقرأ منها مباشرة.
- المفاتيح الحقيقية في Convex Dashboard ← Environment Variables (وليس في قاعدة البيانات).

### 4.8 صلاحيات وسجل
- `requireUser` يمنع الحسابات المعطلة (`users.isDisabled`) من كل الكتابة.
- الأدمن لا يعطّل نفسه ولا يزيل دوره.
- كل إجراء حساس يُسجل في `activityLog` (lib/activityLog.ts) — تبويب «سجل النشاط» بالأدمن.

---

## 5) الإعدادات والأسرار (لا تُرفع لـ GitHub)

| العنصر | أين | ملاحظة |
|---|---|---|
| بيانات FTP | `.env.ftp` | تستخدمها `deploy-ftp.mjs` فقط |
| متغيرات Convex المحلية | `.env.local` | `CONVEX_DEPLOYMENT` / `VITE_CONVEX_URL` |
| مفاتيح Stripe | Convex Dashboard ← Env Vars | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (واحد الويبهوك من لوحة Stripe) |
| مفاتيح Moyasar/Tap (لما تفعّل) | Convex Dashboard ← Env Vars | لا تُخزن في DB |
| تسجيل دخول Convex CLI | `~/.convex/config.json` | accessToken شخصي |

**تذكير**: إدارة الحزم = **Bun** (`bun.lock` متتبع). `package-lock.json` مستبعد من git.

---

## 6) قواعد ذهبية عند التعديل (لا تُخالفها)

1. في `schema.ts`: الإضافة مسموحة، الحذف/إعادة التسمية ممنوعة (حقول جديدة كـ `v.optional`).
2. لا تغيّر أسماء دوال Convex أو معاملاتها — الواجهة و`_generated` تعتمد عليها.
3. التطبيق **عربي RTL** — لا تغيّر الاتجاه ولا نمط Claymorphism (`--clay-*`).
4. ملفات `payments.ts` بـ `"use node"`: **actions فقط** — الـ mutations انقلها لملفات أخرى (سبب نقل `expireUnpaidSession` إلى bookings.ts).
5. استعلامات Convex للقراءة فقط — التعليم/التعديل في mutation منفصلة (سبب `markRead` في messages).
6. على ويندوز استخدم `npx.cmd` أو `cmd /c "npm ..."`.
7. بعد أي تعديل خلفي: `npx convex dev --once` للرفع، ثم build، ثم FTP، ثم git push.

---

## 7) دليل النشر خطوة بخطوة (يعمل الآن)

```powershell
# 1) رفع الخلفية (schema + دوال) إلى Production
npx convex dev --once

# 2) بناء الواجهة
$env:VITE_CONVEX_URL="https://adorable-tortoise-624.convex.cloud"
cmd /c "npm run build"

# 3) رفع dist/ إلى الاستضافة (يقرأ .env.ftp)
node scripts/deploy-ftp.mjs

# 4) التزام ودفع إلى GitHub
git add -A; git commit -m "..."; git push origin main
```

> ⚠️ **deployment الإنتاج الرسمي: `wry-mosquito-572`** — عليه متغيرات المصادقة (JWT/JWKS) والسجل الحي.
> انتبه: `adorable-tortoise-624` deployment شقيق بلا متغيرات مصادقة — لا تبِن الواجهة عليه وإلا انهار auth:signIn (حدث فعلاً وأُصلح).
> بناء الواجهة للنشر: `VITE_CONVEX_URL=https://wry-mosquito-572.convex.cloud` دائماً.

---

## 8) سجل الإنجازات (أحدث الأنظمة — سبتمبر 2026)

| النظام | الملفات | الحالة |
|---|---|---|
| حالات الشقق + أسباب الرفض + إشعارات | admin.ts, schema | ✅ |
| التقويم + حجب تواريخ + منع تعارض مزدوج | calendar.ts, bookings.ts, CalendarBlockManager | ✅ |
| تسعير نهاية الأسبوع + حد أدنى للليالي | lib/pricing.ts, bookings.ts | ✅ |
| حقول الشقة الموسعة (نوع عقار، تنظيف، تأمين، أوقات، قوانين) | schema, ApartmentForm | ✅ |
| حماية الصور (5MB/10 صور/Magic Numbers/ضغط 1920px) | ApartmentForm | ✅ |
| مستحقات المالكين (IBAN + أرصدة + تحويلات + واجهة أدمن) | payouts.ts, OwnerFinance, AdminPayouts | ✅ |
| Stripe Webhook + إنهاء الجلسات المنتهية | http.ts, bookings.ts | ✅ (ينقص STRIPE_WEBHOOK_SECRET فعلي) |
| الصفحات القانونية الثمانية + بحث الرئيسية | Legal.tsx, Landing.tsx | ✅ |
| سجل العمليات الإدارية activityLog | lib/activityLog.ts, admin.ts | ✅ |
| تعطيل الحسابات + حماية الأدوار | admin.ts, authorization.ts | ✅ |
| إعدادات المنصة من الأدمن (تواصل/مزودات) | settings.ts, AdminSettings | ✅ |
| توثيق هوية المالك (رفع + مراجعة) | identity.ts, OwnerIdentityVerification, AdminVerifications | ✅ |
| البلاغات (زر إبلاغ + معالجة أدمن) | reports.ts, AdminReports | ✅ |
| الرسائل مالك↔ضيف + إخفاء الجوال حتى الحجز | messages.ts, Messages.tsx | ✅ |
| رابط خريطة من الإحداثيات | ApartmentDetail | ✅ |

## 9) المتبقي (لا يمنع الإطلاق)

1. **بيانات حقيقية منك**: رقم الجوال الرسمي (من تبويب الإعدادات)، حساب Moyasar/Tap أو Stripe + `STRIPE_WEBHOOK_SECRET` في Env Vars، خدمة بريد (SendGrid/Mailgun)، صورة Open Graph.
2. Pagination للاستعلامات (كلها `.collect()` — أجّلها حتى نمو البيانات).
3. أسعار المواسم/الفعاليات (نهاية الأسبوع جاهزة كأساس).
4. تفاصيل الأسرّة، الإضافة على مراحل مع مسودة، شارة رسائل في الترويسة.
5. `schemaValidation: true` (يتطلب تنظيف بيانات قديمة أولاً).
6. اختبارات آلية للحموايات (حالياً تحقق يدوي عبر القواعد في 6).
7. المرحلة المتقدمة: الإنجليزية، كوبونات، iCal، Google/Apple Sign-in، SMS/WhatsApp.
