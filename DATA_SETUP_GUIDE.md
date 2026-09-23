# 🚀 دليل البيانات التجريبية — شقق العلا

## 📦 الملفات المتاحة

تم إنشاء **4 ملفات كاملة** بالبيانات التجريبية:

| الملف | النوع | الوصف | الحجم |
|------|-------|-------|------|
| `src/convex/seed.complete.ts` | TypeScript | Seed Script جاهز للتشغيل | ~15 KB |
| `SEED_DATA.json` | JSON | البيانات بصيغة JSON | ~85 KB |
| `SEED_DATA.xlsx` | Excel | جدول بيانات تفاعلي | ~250 KB |
| `DATA_SETUP_GUIDE.md` | Markdown | هذا الدليل | ~ |

---

## 🎯 الخطوات السريعة

### الخطوة 1️⃣: تشغيل Seed Script (الطريقة الموصى بها ⭐)

```bash
# 1. تأكد من أن Convex يعمل
bun convex dev

# 2. في نافذة جديدة، شغّل الـ seed
bun convex run seed.complete:seedAll
```

**النتيجة:**
```
🚀 بدء عملية ملء البيانات التجريبية...

1️⃣ إضافة المستخدمين...
   ✅ أحمد محمد (ahmed@example.com)
   ✅ فاطمة علي (fatima@example.com)
   ... (14 مستخدم كليهم)

2️⃣ جلب معرفات الشقق...
✅ تم جلب 8 شقة

3️⃣ إضافة التقييمات...
✅ تم إضافة 152 تقييم

4️⃣ إضافة الحجوزات...
   ✅ حجز: Desert Rose Suite - ahmed@example.com
   ... (30 حجز كليهم)

5️⃣ إضافة المفضلة...
   ✅ ahmed@example.com - 3 مفضلة
   ... (15 مفضلة كليهم)

🎉 تم ملء جميع البيانات التجريبية بنجاح!
```

---

## 📊 البيانات المدرجة

### 👥 المستخدمين (14)

#### مستخدمين عاديين (10):
```
1. ahmed@example.com - أحمد محمد
2. fatima@example.com - فاطمة علي
3. sara@example.com - سارة خالد
4. mohammed@example.com - محمد حسن
5. noor@example.com - نور الدين
6. hana@example.com - هناء علي
7. khalid@example.com - خالد سالم
8. layla@example.com - ليلى عمر
9. omar@example.com - عمر يوسف
10. zainab@example.com - زينب محمود
```

#### مالكي الشقق (3):
```
11. owner1@example.com - علي المالك
12. owner2@example.com - فاطمة صاحبة العقار
13. owner3@example.com - محمد مالك الفيلا
```

#### المدير (1):
```
14. admin@example.com - مدير النظام
```

---

### 📅 الحجوزات (30)

#### توزيع الحجوزات:
- **8 شقق** × 3-4 حجوزات لكل شقة = **30 حجز**

#### حالات الحجوزات:
- ✅ **Confirmed** - حجوزات مؤكدة (معظمها)
- ⏳ **Pending** - حجوزات في الانتظار
- ✔️ **Completed** - حجوزات منتهية

#### مثال الحجوزات:
```
Booking #1: Desert Rose Suite
  - العميل: أحمد محمد
  - التاريخ: 1 - 5 أكتوبر 2026
  - الضيوف: 2
  - السعر: 2,600 ريال
  - الحالة: مؤكد ✅
```

---

### ⭐ التقييمات (152+)

#### التقييمات لكل شقة:

| الشقة | التقييم | عدد التقييمات | الحالة |
|------|---------|-------------|--------|
| Desert Rose Suite | 4.9 ⭐ | 15 | ✅ مكتمل |
| AlUla Cliffside Retreat | 4.8 ⭐ | 15 | ✅ مكتمل |
| Oasis Garden Studio | 4.7 ⭐ | 12 | ✅ مكتمل |
| Dadan Luxury Villa | 4.95 ⭐ | 18 | ✅ مكتمل |
| Elephant Rock View | 4.85 ⭐ | 14 | ✅ مكتمل |
| Hegra Explorer's Lodge | 4.75 ⭐ | 11 | ✅ مكتمل |
| Maraya Concert Suite | 4.6 ⭐ | 10 | ✅ مكتمل |
| AlUla Farmhouse Retreat | 4.88 ⭐ | 12 | ✅ مكتمل |

**المتوسط العام:** 4.82 ⭐

#### أمثلة التعليقات:
```
⭐⭐⭐⭐⭐ "شقة رائعة جداً، الإطلالة خيالية والضيافة ممتازة"

⭐⭐⭐⭐⭐ "تجربة لا تنسى، سأعود بكل تأكيد"

⭐⭐⭐⭐ "جميلة لكن قليلاً بعيدة عن المركز"

⭐⭐⭐⭐⭐ "الغروب من الشرفة لا يُوصف، روعة"
```

---

### ❤️ المفضلة (15)

#### توزيع المفضلة:
```
ahmed@example.com
  ✅ Desert Rose Suite
  ✅ Dadan Luxury Villa
  ✅ Elephant Rock View

fatima@example.com
  ✅ AlUla Cliffside Retreat
  ✅ AlUla Farmhouse Retreat

sara@example.com
  ✅ Oasis Garden Studio
  ✅ Hegra Explorer's Lodge
  ✅ Maraya Concert Suite

mohammed@example.com
  ✅ Dadan Luxury Villa
  ✅ Elephant Rock View

noor@example.com
  ✅ AlUla Cliffside Retreat
  ✅ Desert Rose Suite
```

---

## 📝 كيفية استخدام البيانات

### طريقة 1: استخدام TypeScript Seed Script ⭐ (الأسهل)

```bash
# تشغيل مباشر
bun convex run seed.complete:seedAll
```

**المميزات:**
- ✅ تشغيل سريع وسهل
- ✅ يتحقق من عدم التكرار تلقائياً
- ✅ يعطيك رسالة نجاح
- ✅ مدعوم بـ logging جميل

---

### طريقة 2: استخدام JSON Data

إذا أردت نسخ البيانات يدوياً:

```typescript
// استيراد البيانات
import seedData from './SEED_DATA.json';

// استخدام البيانات
seedData.users.forEach(user => {
  console.log(user.name);
});
```

---

### طريقة 3: استخدام Excel

**للمرجعية والتعديل:**
1. افتح `SEED_DATA.xlsx`
2. اعرض البيانات في تنسيق جدول
3. عدّل ما تريد
4. انسخ البيانات وأدرجها في JSON أو TypeScript

---

## ✅ التحقق من البيانات

بعد التشغيل، تحقق من:

### 1. في لوحة Convex:
```
Dashboard → alula-stays → Collections

✅ apartments: 8 عنصر
✅ users: 14 عنصر
✅ bookings: 30 عنصر
✅ reviews: 152+ عنصر
✅ favorites: 15 عنصر
```

### 2. في الموقع:
```
✅ الصفحة الرئيسية: تظهر الشقق المميزة مع التقييمات
✅ صفحة الشقق: البحث والفلاتر يعملون
✅ تفاصيل الشقة: التقييمات تظهر (4.8+ نجوم)
✅ لوحة التحكم: معلومات الحجوزات تظهر
```

---

## 🔄 إعادة تشغيل البيانات

إذا أردت حذف البيانات وإعادة تشغيل Seed:

### الطريقة 1: حذف قاعدة البيانات
```bash
# توقف Convex أولاً
# افتح Convex Dashboard
# حذف جميع الجداول يدوياً
# ثم شغّل: bun convex run seed.complete:seedAll
```

### الطريقة 2: استخدام Mutation مخصص
```typescript
export const clearAll = mutation({
  handler: async (ctx) => {
    // حذف جميع الجداول
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    // وهكذا لجميع الجداول...
  }
});
```

---

## 🛠️ تخصيص البيانات

### تغيير عدد التقييمات:
في `seed.complete.ts`:
```typescript
// ابحث عن reviewsData
// أضف أو احذف تقييمات حسب الحاجة
```

### تغيير الحجوزات:
```typescript
// عدّل bookingsData
// غيّر التواريخ أو الأسعار أو الحالات
```

### إضافة مستخدمين جدد:
```typescript
usersData.push({
  email: "newuser@example.com",
  name: "المستخدم الجديد",
  phone: "+966...",
  role: "user"
});
```

---

## 📋 جدول المتطلبات

قبل تشغيل البيانات، تأكد من:

| المتطلب | الحالة | التفاصيل |
|--------|--------|----------|
| Node.js/Bun | ✅ | `bun --version` |
| Convex CLI | ✅ | `bun add convex` |
| مشروع Convex | ✅ | `convex.json` موجود |
| قاعدة البيانات | ✅ | `apartments` table موجود |
| TypeScript | ✅ | `src/convex/` جاهز |

---

## ❓ الأسئلة الشائعة

### س: هل ستحذف البيانات الموجودة؟
ج: لا، الـ seed script يضيف بيانات جديدة فقط.

### س: كم وقت يستغرق التشغيل؟
ج: دقيقة واحدة تقريباً (حسب سرعة الإنترنت).

### س: هل يمكن تعديل البيانات بعد الإدراج؟
ج: نعم، تماماً كأي بيانات عادية في قاعدة البيانات.

### س: هل البيانات حقيقية؟
ج: لا، بيانات تجريبية افتراضية لأغراض التطوير والاختبار.

### س: كيف أحذف بيانات معينة؟
ج: استخدم Convex Dashboard أو اكتب mutation للحذف.

---

## 🎯 الخطوات التالية

بعد إدراج البيانات:

- [ ] ✅ اختبر الصفحة الرئيسية
- [ ] ✅ اختبر البحث والفلاتر
- [ ] ✅ اختبر تفاصيل الشقة
- [ ] ✅ تحقق من التقييمات
- [ ] ✅ اختبر الحجوزات (إذا كانت مدمجة)
- [ ] ✅ اختبر المفضلة (إذا كانت مدمجة)

---

## 📞 الدعم والمساعدة

إذا واجهت مشكلة:

1. **تحقق من الـ Logs:**
   ```bash
   bun convex dev
   # اعرض الأخطاء في console
   ```

2. **تحقق من Convex Status:**
   ```bash
   bun convex status
   ```

3. **أعد تشغيل الخادم:**
   ```bash
   # Ctrl+C لإيقاف Convex
   bun convex dev
   ```

---

## 📄 الملفات المرفقة

```
شقق العلا/
├── src/convex/
│   └── seed.complete.ts           ← TypeScript Seed Script
├── SEED_DATA.json                 ← بيانات JSON
├── SEED_DATA.xlsx                 ← جدول Excel
├── DATA_SETUP_GUIDE.md            ← هذا الدليل
└── MISSING_DATA_CHECKLIST.md      ← قائمة البيانات الناقصة
```

---

## 🚀 ملخص سريع

```bash
# 1. تأكد من Convex
bun convex dev

# 2. في نافذة جديدة
bun convex run seed.complete:seedAll

# 3. تحقق من النتائج
# افتح الموقع وشوف التقييمات والحجوزات 🎉
```

---

**تم الإنشاء:** 2026-09-23  
**الإصدار:** 1.0  
**الحالة:** جاهز للاستخدام ✅
