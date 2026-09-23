## 🔒 دليل الأمان والممارسات الجيدة

دليل شامل للأمان والممارسات الموصى بها في مشروع AlUla Stays.

---

## ✅ معايير الأمان المطبقة

### 1. التحقق من صحة البيانات (Data Validation)

**ملف**: `src/convex/lib/validation.ts`

جميع المدخلات يجب التحقق منها قبل المعالجة:

```typescript
// ✅ صحيح
const nights = validateBookingDates(checkIn, checkOut);
validateGuests(guests, apartment.maxGuests);
validatePrice(apartment.price);

// ❌ خطأ - بدون تحقق
const nights = Math.ceil((checkOut - checkIn) / DAY_MS);
```

**المزايا:**
- منع البيانات الخاطئة من الدخول
- رسائل خطأ واضحة للمستخدم
- حماية من الهجمات

### 2. معالجة الأخطاء الموحدة (Error Handling)

**ملف**: `src/convex/lib/errors.ts`

استخدم الفئات المخصصة دائماً:

```typescript
// ✅ صحيح
import { ValidationError, PaymentError } from "./lib/errors";

if (!booking) {
  throw new NotFoundError("الحجز");
}

if (!Number.isFinite(amount)) {
  throw new PaymentError("قيمة الحجز غير صالحة");
}

// ❌ خطأ
if (!booking) {
  throw new Error("الحجز غير موجود");
}
```

**الفوائد:**
- رسائل أخطاء متسقة
- سهولة صيانة الكود
- عدم تسريب معلومات حساسة

### 3. معالجة العملات الآمنة (Money Handling)

**ملف**: `src/convex/lib/money.ts`

أبداً لا تحسب الأسعار مباشرة:

```typescript
// ✅ صحيح - آمن ودقيق
const total = calculateTotalPrice(nights, pricePerNight);
const fee = calculatePlatformFee(total, 10);
const amount = calculateTotalAmount(total, fee);

// ❌ خطأ - قد يسبب مشاكل
const total = nights * pricePerNight;
const fee = Math.round(total * 0.1);
const amount = total + fee;
```

**المشاكل المحلولة:**
- أخطاء التقريب العددي
- القيم السالبة واللانهائية
- عدم التطابق بين الحسابات

### 4. حماية من الهجمات (Rate Limiting)

**ملف**: `src/convex/lib/rateLimiting.ts`

حماية من الاستخدام الزائد والهجمات:

```typescript
// ✅ صحيح
if (!checkRateLimit(userId, "PAYMENT")) {
  throw new PaymentError("تم تجاوز الحد الأقصى");
}

// سياسات مختلفة:
// PAYMENT: 5 طلبات/دقيقة
// BOOKING: 10 طلبات/دقيقة
// LOGIN: 5 محاولات/15 دقيقة
```

### 5. التفويض والصلاحيات (Authorization)

**ملف**: `src/convex/lib/authorization.ts`

التحقق دائماً من الصلاحيات:

```typescript
// ✅ صحيح
export const cancel = mutation({
  handler: async (ctx, args) => {
    const { user, booking } = await requireBookingAccess(ctx, args.bookingId);
    
    // التحقق من أن الحجز ملك المستخدم
    if (booking.userId !== user._id) {
      throw new AuthorizationError(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }
});
```

---

## 🚨 المشاكل الشائعة وكيفية تجنبها

### ❌ المشكلة 1: عدم التحقق من مفاتيح البيئة

```typescript
// ❌ خطأ - قد يفشل في الإنتاج
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

// ✅ صحيح - يرفع خطأ فوراً
function getStripe() {
  const key = validateApiKey(
    process.env.STRIPE_SECRET_KEY,
    "STRIPE_SECRET_KEY"
  );
  return new Stripe(key);
}
```

### ❌ المشكلة 2: حساب الأسعار بدون فحص

```typescript
// ❌ خطأ - قد تكون القيم خاطئة
const totalPrice = nights * price;
const platformFee = Math.round(totalPrice * 0.1);

// ✅ صحيح - فحص شامل
const totalPrice = calculateTotalPrice(nights, price);
const platformFee = calculatePlatformFee(totalPrice, 10);
```

### ❌ المشكلة 3: عدم التعامل مع أخطاء الدفع

```typescript
// ❌ خطأ - قد تفشل العملية بدون رسالة
const session = await stripe.checkout.sessions.create({...});

// ✅ صحيح - التعامل مع الأخطاء
try {
  const session = await stripe.checkout.sessions.create({...});
} catch (error) {
  console.error("Stripe Error:", error);
  throw new PaymentError("حدث خطأ في الدفع");
}
```

### ❌ المشكلة 4: عدم وجود Rate Limiting

```typescript
// ❌ خطأ - أي شخص يمكنه إرسال آلاف الطلبات
export const createBooking = mutation({
  handler: async (ctx, args) => {
    // إنشاء حجز مباشرة
  }
});

// ✅ صحيح - حماية من الهجمات
export const createBooking = mutation({
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!checkRateLimit(user._id, "BOOKING")) {
      throw new PaymentError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
    }
    // إنشاء حجز
  }
});
```

---

## 📋 قائمة التحقق عند الإضافة

عند إضافة ميزة جديدة أو تعديل الكود الموجود، تحقق من:

- [ ] هل تم التحقق من صحة جميع المدخلات؟
- [ ] هل تم استخدام فئات الأخطاء المخصصة؟
- [ ] هل تم التعامل مع جميع الأخطاء المحتملة؟
- [ ] هل هناك حماية من Rate Limiting إذا لزم الأمر؟
- [ ] هل تم فحص الصلاحيات والتفويض؟
- [ ] هل الأسعار محسوبة باستخدام دوال آمنة؟
- [ ] هل تم اختبار جميع الحالات الحدية (Edge Cases)؟
- [ ] هل توجد رسائل خطأ واضحة ومفيدة؟
- [ ] هل تم تسجيل الأخطاء (Logging) للمراقبة؟

---

## 🔍 مراجعة الكود (Code Review)

**نقاط التركيز:**

1. **الأمان**: هل البيانات آمنة؟
2. **الأداء**: هل الكود سريع؟
3. **الوضوح**: هل الكود واضح وسهل الفهم؟
4. **الاختبار**: هل تم اختبار كل الحالات؟
5. **التوثيق**: هل الكود موثق بشكل جيد؟

---

## 📞 الاتصال والدعم

إذا كان لديك أسئلة حول الأمان أو الممارسات الجيدة، تواصل مع فريق التطوير.
