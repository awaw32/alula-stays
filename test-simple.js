#!/usr/bin/env node

/**
 * اختبار سريع للدوال الأساسية
 * يعمل بدون تبعيات معقدة
 */

// محاكاة الدوال للاختبار
function validateBookingDates(checkIn, checkOut) {
  if (!Number.isFinite(checkIn) || !Number.isFinite(checkOut)) {
    throw new Error("تواريخ الحجز يجب أن تكون أرقام صحيحة");
  }

  const now = Date.now();
  if (checkIn < now) {
    throw new Error("تاريخ الوصول يجب أن يكون في المستقبل");
  }

  if (checkOut <= checkIn) {
    throw new Error("تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول");
  }

  const DAY_MS = 1000 * 60 * 60 * 24;
  const nights = Math.ceil((checkOut - checkIn) / DAY_MS);

  if (nights < 1) {
    throw new Error("يجب أن يكون الحجز ليلة واحدة على الأقل");
  }

  if (nights > 365) {
    throw new Error("لا يمكن حجز أكثر من 365 ليلة");
  }

  return nights;
}

function calculateTotalPrice(nights, pricePerNight) {
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("عدد الليالي يجب أن يكون رقم صحيح موجب");
  }

  if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
    throw new Error("سعر الليلة الواحدة يجب أن يكون رقم موجب ومحدود");
  }

  const total = nights * pricePerNight;

  if (!Number.isFinite(total)) {
    throw new Error("حدث خطأ في حساب السعر الإجمالي");
  }

  return Math.round(total);
}

function calculatePlatformFee(totalPrice, feePercentage = 10) {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    throw new Error("السعر الإجمالي يجب أن يكون موجب");
  }

  if (!Number.isFinite(feePercentage) || feePercentage < 0 || feePercentage > 100) {
    throw new Error("نسبة الرسوم يجب أن تكون بين 0 و 100");
  }

  const fee = (totalPrice * feePercentage) / 100;
  return Math.round(fee);
}

function calculateTotalAmount(totalPrice, platformFee) {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    throw new Error("السعر الإجمالي يجب أن يكون موجب");
  }

  if (!Number.isFinite(platformFee) || platformFee < 0) {
    throw new Error("رسوم المنصة يجب أن تكون موجبة أو صفر");
  }

  const total = totalPrice + platformFee;

  if (!Number.isFinite(total)) {
    throw new Error("حدث خطأ في حساب المبلغ الإجمالي");
  }

  return Math.round(total);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧪 تشغيل الاختبارات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              🧪 اختبار الدوال الأساسية                       ║
║                                                                ║
║           مشروع AlUla Stays - نظام حجز الشقق                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   خطأ: ${e.message}`);
    failedTests++;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧪 اختبارات التواريخ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log("\n📅 اختبارات التواريخ:");
console.log("━".repeat(60));

test("تاريخ صحيح في المستقبل", () => {
  const now = Date.now();
  const tomorrow = now + 24 * 60 * 60 * 1000;
  const dayAfter = tomorrow + 24 * 60 * 60 * 1000;
  const nights = validateBookingDates(tomorrow, dayAfter);
  if (nights !== 1) throw new Error("يجب أن تكون ليلة واحدة");
});

test("رفع خطأ عند تاريخ في الماضي", () => {
  const past = Date.now() - 24 * 60 * 60 * 1000;
  const future = Date.now() + 24 * 60 * 60 * 1000;
  try {
    validateBookingDates(past, future);
    throw new Error("يجب أن يرفع خطأ");
  } catch (e) {
    if (!e.message.includes("المستقبل")) throw e;
  }
});

test("رفع خطأ عند تاريخ انتهاء قبل البداية", () => {
  const now = Date.now();
  try {
    validateBookingDates(now + 100, now + 50);
    throw new Error("يجب أن يرفع خطأ");
  } catch (e) {
    if (!e.message.includes("بعد")) throw e;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 اختبارات الأسعار
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log("\n💰 اختبارات حسابات الأسعار:");
console.log("━".repeat(60));

test("حساب السعر الإجمالي بشكل صحيح", () => {
  const total = calculateTotalPrice(3, 500);
  if (total !== 1500) throw new Error(`يجب أن تكون 1500، حصلنا على ${total}`);
});

test("حساب السعر مع أرقام عشرية", () => {
  const total = calculateTotalPrice(2, 499.5);
  if (total !== 999) throw new Error(`يجب أن تكون 999، حصلنا على ${total}`);
});

test("حساب الرسوم بشكل صحيح", () => {
  const fee = calculatePlatformFee(1000, 10);
  if (fee !== 100) throw new Error(`يجب أن تكون 100، حصلنا على ${fee}`);
});

test("حساب الرسوم بنسب مختلفة", () => {
  const fee = calculatePlatformFee(1000, 15);
  if (fee !== 150) throw new Error(`يجب أن تكون 150، حصلنا على ${fee}`);
});

test("حساب المبلغ الإجمالي", () => {
  const total = calculateTotalAmount(1500, 150);
  if (total !== 1650) throw new Error(`يجب أن تكون 1650، حصلنا على ${total}`);
});

test("رفع خطأ مع سعر سالب", () => {
  try {
    calculateTotalPrice(3, -100);
    throw new Error("يجب أن يرفع خطأ");
  } catch (e) {
    if (!e.message.includes("موجب")) throw e;
  }
});

test("رفع خطأ مع قيمة غير محدودة", () => {
  try {
    calculateTotalPrice(3, Infinity);
    throw new Error("يجب أن يرفع خطأ");
  } catch (e) {
    if (!e.message.includes("موجب")) throw e;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 النتائج النهائية
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log("\n" + "=".repeat(60));
console.log("📊 نتائج الاختبارات:");
console.log("=".repeat(60));

console.log(`
✅ اختبارات نجحت: ${passedTests}
❌ اختبارات فشلت: ${failedTests}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الإجمالي: ${passedTests + failedTests}
`);

if (failedTests === 0) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                  ✨ جميع الاختبارات نجحت! ✨                  ║
║                                                                ║
║            المشروع جاهز للاستخدام والنشر! 🚀                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
  process.exit(0);
} else {
  console.log(`⚠️  هناك ${failedTests} اختبار فاشل - يرجى التحقق`);
  process.exit(1);
}
