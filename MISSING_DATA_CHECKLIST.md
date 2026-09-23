# ✅ قائمة البيانات الناقصة — شقق العلا

## 📊 الحالة الحالية للموقع

| ✅ موجود | ❌ ناقص |
|---------|--------|
| 8 شقق بيانات تجريبية | نظام الحجوزات كامل |
| نظام البحث والفلاتر | نظام الدفع (Stripe) |
| صفحات العرض | التقييمات الفعلية (Reviews) |
| نظام المصادقة | قائمة المفضلة |
| | لوحة مالك الشقة |
| | لوحة الإدارة |

---

## 🔴 **الأولويات العالية — بيانات أساسية**

### 1️⃣ **جدول الحجوزات (BOOKINGS)**
**الحالة:** ❌ ناقص تماماً
**الأهمية:** حيوية 🔴

```typescript
// المتطلبات:
bookings table:
  - apartmentId        → معرف الشقة المحجوزة
  - userId             → معرف الضيف
  - checkIn            → تاريخ الدخول
  - checkOut           → تاريخ الخروج
  - numberOfGuests     → عدد الضيوف
  - totalPrice         → السعر الإجمالي
  - status             → الحالة (pending, confirmed, cancelled, completed)
  - specialRequests    → طلبات خاصة
  - createdAt          → تاريخ الحجز
  - paymentId          → معرف الدفع (من Stripe)
```

**البيانات التجريبية المطلوبة:**
- [ ] 20-30 حجز تجريبي بحالات مختلفة
- [ ] حجوزات قديمة (completed)
- [ ] حجوزات قادمة (confirmed)
- [ ] حجوزات معلقة (pending)

---

### 2️⃣ **بيانات التقييمات الفعلية (REVIEWS SEED DATA)**
**الحالة:** ❌ جدول موجود لكن فارغ (صفر تقييم)
**الأهمية:** حيوية للمصداقية 🔴

```typescript
// البيانات المطلوبة:
reviews table (موجود بالفعل):
  - apartmentId        → معرف الشقة
  - userId             → معرف المقيّم
  - rating             → التقييم (1-5 نجوم)
  - comment            → التعليق
  - createdAt          → تاريخ التقييم

// مثال:
Desert Rose Suite:
  - 4.9 ⭐ (من 15 تقييم تقريباً)
  - تقييمات مختلفة: 5⭐, 4⭐, 5⭐, 5⭐, 4⭐, 5⭐...
```

**البيانات التجريبية المطلوبة:**
- [ ] 100-150 تقييم توزيعها على الشقق الـ 8
- [ ] تقييمات متنوعة (من 4-5 نجوم بشكل أساسي)
- [ ] تعليقات واقعية بالعربية والإنجليزية
- [ ] توزيع منطقي: الشقق المميزة لها تقييمات أعلى

**مثال الحالة الحالية:**
```
Desert Rose Suite
Rating: 4.9 ⭐
Reviews: 0  ❌ (يجب أن يكون 15+ على الأقل)
```

---

### 3️⃣ **جدول المفضلة (FAVORITES)**
**الحالة:** ❌ ناقص تماماً
**الأهمية:** ميزة أساسية 🔴

```typescript
favorites table:
  - userId             → معرف المستخدم
  - apartmentId        → معرف الشقة المضافة للمفضلة
  - addedAt            → تاريخ الإضافة
```

**البيانات التجريبية:**
- [ ] بيانات مفضلة لـ 3-5 مستخدمين تجريبيين
- [ ] كل مستخدم لديه 2-4 شقق مفضلة

---

### 4️⃣ **بيانات الدفع (PAYMENTS)**
**الحالة:** ❌ ناقص تماماً (Stripe غير مدمج)
**الأهمية:** حيوية للتشغيل 🔴

```typescript
payments table:
  - bookingId          → معرف الحجز
  - amount             → المبلغ بالريال
  - currency           → العملة (SAR)
  - status             → الحالة (pending, completed, failed, refunded)
  - stripePaymentId    → معرف Stripe
  - method             → طريقة الدفع (credit_card, apple_pay, etc)
  - createdAt          → تاريخ الدفع
```

**المطلوب:**
- [ ] إعداد حساب Stripe
- [ ] مفاتيح API (Public Key + Secret Key)
- [ ] إنشاء جدول payments في Convex
- [ ] Mutations للدفع

---

## 🟡 **الأولويات المتوسطة — بيانات إضافية**

### 5️⃣ **صور حقيقية للشقق**
**الحالة:** ⚠️ صور placeholder من Unsplash
**الأهمية:** جودة العرض 🟡

```typescript
// الحالية:
images: [
  "https://images.unsplash.com/photo-...",
  "https://images.unsplash.com/photo-...",
  ...
]

// المطلوب:
- [ ] 4-6 صور حقيقية لكل شقة
- [ ] صور عالية الجودة (1920x1080 على الأقل)
- [ ] صور تبرز المميزات: غرفة نوم، مطبخ، حمام، إطلالة
- [ ] يمكن استخدام Cloudinary أو AWS S3
```

---

### 6️⃣ **بيانات المستخدمين (USERS SEED)**
**الحالة:** ⚠️ جدول موجود لكن فارغ
**الأهمية:** للاختبار 🟡

```typescript
users table:
  - email              → البريد الإلكتروني
  - name               → الاسم
  - phone              → رقم الهاتف
  - profileImage       → صورة الملف الشخصي
  - role               → الدور (user, owner, admin)
  - createdAt          → تاريخ الإنشاء
```

**البيانات التجريبية:**
- [ ] 10 مستخدمين عاديين (guests)
- [ ] 3 مالكي شقق (owners)
- [ ] 1 مدير (admin)

**مثال:**
```
User #1: Ahmed (guest) - ahmed@example.com
User #2: Fatima (guest) - fatima@example.com
User #3: Ali (owner) - ali@example.com (مالك Desert Rose Suite)
...
```

---

### 7️⃣ **بيانات الحجوزات المتعارضة (BOOKING CONFLICTS)**
**الحالة:** ❌ ناقصة
**الأهمية:** تجنب النقرات المزدوجة 🟡

**المطلوب:**
- [ ] calendar/availability table لكل شقة
- [ ] أو logic في الحجز للتحقق من التعارضات

---

### 8️⃣ **بيانات الخصومات والعروض**
**الحالة:** ❌ ناقصة
**الأهمية:** للترويج 🟡

```typescript
promotions table:
  - code               → كود الخصم (مثل SUMMER20)
  - discountPercent    → نسبة الخصم
  - validFrom/To       → فترة الصلاحية
  - maxUses            → عدد الاستخدامات المسموحة
  - minBookingAmount   → الحد الأدنى للحجز
```

**البيانات التجريبية:**
- [ ] 3-5 أكواد خصم
- [ ] مثال: SUMMER20 (خصم 20% صيف)
- [ ] FIRSTBOOK (خصم 10% للحجز الأول)

---

## 🟢 **الأولويات المنخفضة — نيس تو هيف**

### 9️⃣ **إحصائيات المشرف**
**الحالة:** ❌ ناقصة

```
- إجمالي الحجوزات
- إجمالي الإيرادات
- معدل التشغيل (occupancy rate)
- أعلى الشقق طلباً
- رضا العملاء (average rating)
```

---

### 🔟 **بيانات الدعم والرسائل**
**الحالة:** ❌ ناقصة

```typescript
messages/support table:
  - userId             → المرسل
  - subject            → الموضوع
  - message            → الرسالة
  - status             → الحالة (open, replied, closed)
  - createdAt          → التاريخ
```

---

## 📋 **جدول البيانات الموصى به**

```typescript
// الترتيب الزمني للإضافة:

1️⃣ bookings table (الأساس)
2️⃣ reviews seed data (تحديث الموجود)
3️⃣ payments table + Stripe integration
4️⃣ favorites table
5️⃣ users seed data
6️⃣ صور حقيقية للشقق
7️⃣ promotions table
8️⃣ availability/conflicts check
9️⃣ messages/support table
🔟 analytics/statistics
```

---

## 💾 **تنسيق البيانات المطلوب**

### للبيانات التجريبية (Seed):

**خيار 1: JSON في ملف**
```json
{
  "bookings": [
    {
      "apartmentId": "...",
      "userId": "...",
      "checkIn": "2026-10-01",
      "checkOut": "2026-10-05",
      ...
    }
  ],
  "reviews": [...],
  "favorites": [...]
}
```

**خيار 2: Excel/CSV**
```
apartmentId, userId, checkIn, checkOut, numberOfGuests, totalPrice, status
apartment1, user1, 2026-10-01, 2026-10-05, 2, 2600, confirmed
apartment2, user2, 2026-10-10, 2026-10-15, 4, 4800, pending
...
```

**خيار 3: TypeScript seed script**
```typescript
// بنفس أسلوب src/convex/seed.ts الحالي
```

---

## 🎯 **الخلاصة**

### البيانات الحتمية (100% مطلوبة):
```
✅ جدول الحجوزات (bookings)
✅ بيانات التقييمات (reviews)
✅ جدول الدفع (payments) + Stripe
✅ قائمة المفضلة (favorites)
```

### البيانات التكميلية:
```
✅ بيانات المستخدمين
✅ صور حقيقية
✅ أكواد الخصم
✅ الإحصائيات
```

---

## 📞 الخطوة التالية

اختر التنسيق الذي تفضله (JSON, Excel, TypeScript) وسأساعدك في:
1. **إنشاء البيانات التجريبية** ✅
2. **كتابة seed scripts** ✅
3. **دمجها في Convex** ✅
4. **اختبار الموقع** ✅

هل تريد أن تبدأ من أي بيانات؟ 🚀
