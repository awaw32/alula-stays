# 📋 توثيق مشروع شقق العلا — AlUla Apartments

## نظرة عامة على المشروع

منصة حجز شقق في مدينة العلا (السعودية) مستوحاة من جمال الطبيعة الصحراوية. المشروع مبني بتقنية **Claymorphism** (تصميم طيني ناعم) بألوان مستوحاة من صخور العلا التراكوتا.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

| العنصر | التقنية |
|--------|---------|
| الواجهة الأمامية | React 19 + TypeScript |
| البناء | Vite 7 |
| التصميم | Tailwind CSS 4 + Claymorphism |
| الأنيميشن | Framer Motion |
| الأيقونات | Lucide React |
| القوائم والألوان | shadcn/ui |
| الخادم وقاعدة البيانات | Convex |
| المصادقة | Convex Auth (Email OTP + Anonymous) |
| حزمة إدارة | Bun |

---

## 📁 هيكل المشروع

```
├── index.html                    # الصفحة الرئيسية (.lang=ar, dir=rtl, خطوط Google)
├── src/
│   ├── main.tsx                  # نقطة الدخول + التوجيه (Routing)
│   ├── index.css                 # ثيم Claymorphism + الخطوط العربية
│   ├── convex/
│   │   ├── schema.ts             # مخطط قاعدة البيانات (Apartments, Reviews)
│   │   ├── apartments.ts         # استعلامات الشقق (list, get, featured, stats)
│   │   ├── seed.ts               # بيانات تجريبية (8 شقق في العلا)
│   │   ├── auth.ts               # إعداد المصادقة
│   │   └── users.ts              # جدول المستخدمين
│   ├── pages/
│   │   ├── Landing.tsx           # الصفحة الرئيسية (Hero + شقق مميزة + ميزات)
│   │   ├── Apartments.tsx        # صفحة تصفح الشقق مع البحث والفلاتر
│   │   ├── ApartmentDetail.tsx   # صفحة تفاصيل الشقة + صور + حجز
│   │   ├── Auth.tsx              # صفحة تسجيل الدخول
│   │   ├── Dashboard.tsx         # لوحة التحكم (مبدئية)
│   │   └── NotFound.tsx          # صفحة 404
│   └── components/
│       ├── Navigation.tsx        # شريط التنقل (Desktop + Mobile Bottom Bar)
│       ├── ClayCard.tsx          # بطاقة Claymorphism قابلة لإعادة الاستخدام
│       ├── ApartmentCard.tsx     # بطاقة عرض الشقة
│       ├── RequireAuth.tsx       # حماية المسارات المحمية
│       └── ui/                   # مكونات shadcn/ui
```

---

## ✅ ما تم إنجازه (Version 1 — النسخة الأولى)

### 1. قاعدة البيانات (Convex Schema)

**ملف:** `src/convex/schema.ts`

```
apartments table:
  - title, titleAr          → عنوان الشقة (إنجليزي + عربي)
  - description, descriptionAr → وصف الشقة
  - price                   → السعر بالريال السعودي / ليلة
  - bedrooms, bathrooms     → عدد الغرف والحمامات
  - maxGuests, area         → عدد الضيوف الأقصى + المساحة بالمتر المربع
  - location, locationAr    → الموقع + الموقع بالعربي
  - latitude, longitude     → إحداثيات الخريطة
  - images                  → مصفوفة روابط الصور
  - amenities               → مصفوفة المرافق (wifi, parking, ac, pool...)
  - rating, reviewCount     → التقييم وعدد التقييمات
  - isVerified              → شقة موثقة
  - isFeatured              → شقة مميزة
  - badges                  → شارات (top_rated, verified, premium, guest_favorite)
  - rules, rulesAr          → قواعد الإقامة
  - ownerId                 → معرف المالك
  - available               → حالة التوفر

reviews table:
  - apartmentId             → معرف الشقة
  - userId                  → معرف المستخدم
  - rating                  → التقييم (1-5)
  - comment                 → التعليق
  - createdAt               → تاريخ الإنشاء
```

**الاستعلامات المتاحة:**
| الاستعلام | الوصف |
|-----------|-------|
| `apartments:list` | جلب الشقق مع فلترة (موقع، سعر، غرف) وترتيب |
| `apartments:get` | جلب شقة واحدة بالـ ID |
| `apartments:featured` | جلب الشقق المميزة (حتى 6) |
| `apartments:locations` | جلب قائمة المناطق المتاحة |
| `apartments:stats` | إحصائيات عامة (عدد الشقق، متوسط السعر، متوسط التقييم) |

### 2. البيانات التجريبية (Seed Data)

**ملف:** `src/convex/seed.ts`

تم إدخال **8 شقق** في قاعدة البيانات:

| الشقة | الموقع | السعر/ليلة | الغرف | التقييم |
|--------|--------|------------|--------|---------|
| Desert Rose Suite | Heritage Village | 650 ر.س | 2 | 4.9 |
| AlUla Cliffside Retreat | Jabal Ithlib | 1,200 ر.س | 3 | 4.8 |
| Oasis Garden Studio | AlUla Old Town | 350 ر.س | 1 | 4.7 |
| Dadan Luxury Villa | Dadan | 2,200 ر.س | 4 | 4.95 |
| Elephant Rock View | Elephant Rock | 780 ر.س | 2 | 4.85 |
| Hegra Explorer's Lodge | Hegra | 520 ر.س | 1 | 4.75 |
| Maraya Concert Suite | AlUla Arts District | 900 ر.س | 2 | 4.6 |
| AlUla Farmhouse Retreat | AlUla Oasis | 850 ر.س | 3 | 4.88 |

### 3. ثيم التصميم Claymorphism

**ملف:** `src/index.css`

**الألوان:**
| المتغير | اللون | الاستخدام |
|---------|-------|-----------|
| `--clay-accent` | `#C2694F` (تراكوتا) | اللون الأساسي — أزرار، روابط، عناصر نشطة |
| `--clay-gold` | `#D4A574` (ذهبي) | اللون الثانوي — تدرجات، شارات |
| `--background` | `#FAF6F1` (أوف-وايت) | خلفية الصفحة |
| `--foreground` | `#3D2B1F` (بني غامق) | النصوص الرئيسية |
| `--clay-surface` | `#F7EDE4` (بيج) | خلفية الحقول والمدخلات |
| `--clay-shadow-dark` | `#D9C8B8` | الظل الداكن (من الأسفل) |
| `--clay-shadow-light` | `#FFFFFF` | الظل الفاتح (من الأعلى) |

**تأثيرات Claymorphism:**
```css
.clay          → بطاقة رئيسية بظلال مزدوجة
.clay-sm       → بطاقة صغيرة
.clay-inset    → حقل مدخلات غائر
.clay-btn      → زر مubbّع
.clay-btn-outline → زر مubbّع بحدود
.clay-input    → حقل إدخال غائر
```

### 4. الخطوط العربية الاحترافية

**ملف:** `index.html` + `src/index.css`

- **الخط الأساسي:** [Al Marai](https://fonts.google.com/specimen/Al+Marai) — خط عربي احترافي حديث من Google (يستخدمه nhiều مواقع حكومية سعودية)
- **الخط البديل:** [Noto Sans Arabic](https://fonts.google.com/noto/specimen/Noto+Sans+Arabic) — خط شامل ونظيف
- **الوزن:** 300 (خفيف) → 900 (عريض جداً)
- **الإعدادات:** `line-height: 1.7` للنصوص، `1.3` للعناوين، `text-rendering: optimizeLegibility`

### 5. الصفحة الرئيسية (Landing Page)

**ملف:** `src/pages/Landing.tsx`

الأقسام:
1. **Hero Section** — عنوان متحرك + شريط بحث + إحصائيات
2. **شقق مميزة** — شبكة 3 أعمدة من بطاقات الشقق المميزة
3. **لماذا العلا؟** — 4 بطاقات (جبال رملية، مواقع تراثية، تجارب فريدة، غروب ساحر)
4. **لماذا تختار شقق العلا** — 4 ميزات (شقق موثقة، تقييمات حقيقية، حجز فوري، دعم مستمر)
5. **CTA** — دعوة للحجز مع تدرج لوني
6. **Footer** — معلومات التواصل + روابط سريعة

### 6. صفحة تصفح الشقق

**ملف:** `src/pages/Apartments.tsx`

- **شريط بحث** — بحث نصي + فلتر الموقع + ترتيب + فلتر متقدم
- **الفلاتر المتقدمة:**
  - عدد الغرف (1، 2، 3، 4+)
  - نطاق السعر (من/إلى بالريال)
  - زر مسح الفلاتر
- **شبكة عرض** — 3 أعمدة (Desktop) / 2 (Tablet) / 1 (Mobile)
- **حالات تحميل** — Skeleton loading animations
- **رسالة عدم وجود نتائج** مع زر مسح الفلاتر

### 7. صفحة تفاصيل الشقة

**ملف:** `src/pages/ApartmentDetail.tsx`

- **معرض الصور** — صورة رئيسية كبيرة + شريط صور مصغرة + Lightbox
- **بطاقة المعلومات** — العنوان + الموقع + التقييم + إحصائيات سريعة
- **الوصف** — نص كامل للشقة
- **المرافق** — شبكة أيقونات (WiFi، مواقف، مطبخ، تكييف، إطلالة، مسبح...)
- **قواعد الإقامة** — قائمة نقاط
- **الخريطة** — iframe من OpenStreetMap + زر "احصل على الاتجاهات" لـ Google Maps
- **شريط الحجز** (Sticky Sidebar) — السعر + التقييم + اختيار التواريخ + عدد الضيوف + زر "احجز الآن"

### 8. شريط التنقل

**ملف:** `src/components/Navigation.tsx`

- **Desktop Header** — شعار + روابط + زر تسجيل الدخول
- **Mobile Bottom Bar** — 5 أيقونات في الأسفل (لإبهام)
- **Mobile Menu** — قائمة منسدلة عند النقر على الهامبرجر

### 9. التوجيه (Routing)

**ملف:** `src/main.tsx`

| المسار | الصفحة | محمية؟ |
|--------|--------|--------|
| `/` | الصفحة الرئيسية | ❌ |
| `/apartments` | تصفح الشقق | ❌ |
| `/apartment/:id` | تفاصيل الشقة | ❌ |
| `/auth` | تسجيل الدخول | ❌ |
| `/dashboard` | لوحة التحكم | ✅ (تحتاج مصادقة) |
| `*` | صفحة 404 | ❌ |

---

## 🔜 ما تبقى (Version 2+)

### أولوية عالية 🔴

| الميزة | الوصف | التقنية المقترحة |
|--------|-------|-------------------|
| **نظام الحجز** | اختيار التواريخ + حساب السعر + تأكيد الحجز | Convex mutations + calendar picker |
| **نظام الدفع** | الدفع الإلكتروني (مدى، Apple Pay، Visa/MC) | [Moyasar](https://moyasar.com/) أو [PayTabs](https://paytabs.com/) |
| **نظام التقييمات** | تقييم وتعليق المستخدمين بعد الإقامة | Convex reviews table (موجود بالفعل) |
| **المفضلة** | حفظ الشقق في قائمة المفضلة | Convex table + أيقونة قلب |
| **لوحة مالك الشقة** | إضافة/تعديل/حذف الشقق + تقويم الحجوزات | Dashboard route محمية |
| **لوحة الإدارة** | مراجعة الشقق + إدارة المستخدمين + التقارير | Admin role في Convex |

### أولوية متوسطة 🟡

| الميزة | الوصف | التقنية المقترحة |
|--------|-------|-------------------|
| **الدعم اللغوي** | تبديل عربي/إنجليزي | i18n library أو مكتبة مخصصة |
| **الخرائط التفاعلية** | خريطة Google Maps حقيقية | Google Maps JavaScript API |
| **رفع الصور** | أصحاب الشقق يرفعون صوراً | AWS S3 أو Cloudinary |
| **نظام الإشعارات** | إشعارات عند حجز جديد / تأكيد | Push Notifications + SMS |
| **سياسة الإلغاء** | حساب رسوم الإلغاء تلقائياً | قاعدة بيانات + خوارزمية زمنية |

### أولوية منخفضة 🟢

| الميزة | الوصف |
|--------|-------|
| تطبيق جوال | React Native أو Flutter |
| تحليلات | Google Analytics أو Mixpanel |
| شارات تلقائية | منح شارات "الأكثر طلباً" تلقائياً بناءً على التقييمات |
| نظام الدعوات | كود خصم + دعوة أصدقاء |

---

## 🚀 خطوات التشغيل

### 1. تثبيت التبعيات
```bash
bun install
```

### 2. تشغيل قاعدة البيانات
```bash
bun convex dev
```

### 3. إدخال البيانات التجريبية
```bash
bun convex run seed:seed
```

### 4. تشغيل الخادم المحلي
```bash
bun dev
```

---

## 📝 ملاحظات للمبرمج التالي

1. **قاعدة البيانات:** جدول `apartments` و `reviews` جاهز. أضف جدولاً `bookings` عند بناء نظام الحجز.

2. **الثيم:** جميع الألوان والظلال محددة في `index.css`. استخدم الفئات `.clay`, `.clay-sm`, `.clay-inset`, `.clay-btn`, `.clay-input` بدلاً من التصميم من الصفر.

3. **الصور:** حالياً الصور من Unsplash. استبدلها بصور حقيقية للشقق عند توفرها. حد `images[]` في Schema يتقبل أي عدد من الروابط.

4. **الخرائط:** الصفحة تستخدم OpenStreetMap iframe حالياً. استبدلها بـ Google Maps API للحصول على تجربة أفضل مع زر الاتجاهات.

5. **الحجز:** شريط الحجز في `ApartmentDetail.tsx` مبدئي. أضف Mutations للحجز الفعلي مع calendar picker ونظام دفع.

6. **الأدوار:** جدول المستخدمين يدعم `admin`, `user`, `member`. استخدم `role` للتحكم في الوصول.

7. **البيانات التجريبية:** شغّل `bun convex run seed:seed` مرة واحدة فقط. السكربت يتحقق من عدم التكرار.

8. **الخطوط:** تم تحميل Al Marai و Noto Sans Arabic من Google Fonts في `index.html`. لا تحذفهما.
