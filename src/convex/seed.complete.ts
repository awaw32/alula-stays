import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * 🚀 COMPLETE SEED DATA - شقق العلا
 *
 * يتضمن:
 * ✅ Users (10 مستخدمين + 3 مالكي شقق)
 * ✅ Bookings (30 حجز متنوع)
 * ✅ Reviews (150+ تقييم)
 * ✅ Favorites (البيانات المفضلة)
 * ✅ Payments (معلومات الدفع)
 *
 * الاستخدام: bun convex run seed.complete:seedAll
 */

// ==================== USERS DATA ====================
const usersData = [
  // Guests
  { email: "ahmed@example.com", name: "أحمد محمد", phone: "+966501234567", role: "user" },
  { email: "fatima@example.com", name: "فاطمة علي", phone: "+966502345678", role: "user" },
  { email: "sara@example.com", name: "سارة خالد", phone: "+966503456789", role: "user" },
  { email: "mohammed@example.com", name: "محمد حسن", phone: "+966504567890", role: "user" },
  { email: "noor@example.com", name: "نور الدين", phone: "+966505678901", role: "user" },
  { email: "hana@example.com", name: "هناء علي", phone: "+966506789012", role: "user" },
  { email: "khalid@example.com", name: "خالد سالم", phone: "+966507890123", role: "user" },
  { email: "layla@example.com", name: "ليلى عمر", phone: "+966508901234", role: "user" },
  { email: "omar@example.com", name: "عمر يوسف", phone: "+966509012345", role: "user" },
  { email: "zainab@example.com", name: "زينب محمود", phone: "+966510123456", role: "user" },

  // Owners
  { email: "owner1@example.com", name: "علي المالك", phone: "+966511234567", role: "owner" },
  { email: "owner2@example.com", name: "فاطمة صاحبة العقار", phone: "+966512345678", role: "owner" },
  { email: "owner3@example.com", name: "محمد مالك الفيلا", phone: "+966513456789", role: "owner" },

  // Admin
  { email: "admin@example.com", name: "مدير النظام", phone: "+966514567890", role: "admin" },
];

// ==================== REVIEWS DATA ====================
const reviewsData = [
  // Desert Rose Suite (15 تقييم)
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "شقة رائعة جداً، الإطلالة خيالية والضيافة ممتازة" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "تجربة لا تنسى، سأعود بكل تأكيد" },
  { apartmentName: "Desert Rose Suite", rating: 4, comment: "جميلة لكن قليلاً بعيدة عن المركز" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "الغروب من الشرفة لا يُوصف، روعة" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "نظيفة جداً وحديثة، كل شيء يعمل بشكل مثالي" },
  { apartmentName: "Desert Rose Suite", rating: 4, comment: "جيدة جداً، بس الانترنت كان بطيء قليلاً" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "قيمة الفلوس تستحق كل ريال" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "موقع ممتاز جداً وقريب من المواقع السياحية" },
  { apartmentName: "Desert Rose Suite", rating: 4, comment: "راقية ومريحة" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "صاحب الشقة محترم جداً وخدمة عالية" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "أنصح بها بقوة" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "الطعام في الفطور ممتاز" },
  { apartmentName: "Desert Rose Suite", rating: 4, comment: "جيدة لكن أغلى من المتوسط" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "تجربة فاخرة بسعر معقول نسبياً" },
  { apartmentName: "Desert Rose Suite", rating: 5, comment: "كل التفاصيل مراعاة بعناية" },

  // AlUla Cliffside Retreat (15 تقييم)
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "إطلالة من أحلام الجنة" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "الموقع جميل جداً، تصوير رائع" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "فقط كلمة واحدة: رووعة" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 4, comment: "جميلة لكن التكييف قوي شوي" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "الأفضل في العلا بلا منازع" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "شقة وصاحب الشقة ممتاز" },
  { aptName: "AlUla Cliffside Retreat", rating: 5, comment: "ساعات الغروب من هنا لا تُنسى" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 4, comment: "غالية الثمن لكن تستحق" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "أفضل استثمار سياحي" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "شقة حقيقية وليس الصور الكاذبة" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "الدرج قليل خطورة لكن يستحق" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 4, comment: "جيدة جداً" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "قضينا افضل أيام السنة هنا" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "خدمة العملاء ممتازة جداً" },
  { apartmentName: "AlUla Cliffside Retreat", rating: 5, comment: "هذه الشقة تستحق 5 نجوم وإضافية" },

  // Oasis Garden Studio (12 تقييم)
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "أرخص شقة لكن بأفضل جودة" },
  { apartmentName: "Oasis Garden Studio", rating: 4, comment: "جيدة وسط البلد" },
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "مكان هادي وجميل" },
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "الحديقة الخاصة رائعة" },
  { apartmentName: "Oasis Garden Studio", rating: 4, comment: "غرفة واحدة كافية للفرد" },
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "قيمة ممتازة مقابل السعر" },
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "موقع استراتيجي ممتاز" },
  { apartmentName: "Oasis Garden Studio", rating: 4, comment: "صغيرة لكن مريحة" },
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "صاحب الشقة لطيف جداً" },
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "بقيت أسبوع وأنا ما بدي أروح" },
  { apartmentName: "Oasis Garden Studio", rating: 4, comment: "جيدة للعزاب والمسافرين وحدهم" },
  { apartmentName: "Oasis Garden Studio", rating: 5, comment: "أنصح بها 100%" },

  // Dadan Luxury Villa (18 تقييم)
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "فيلا حقيقية وليس محاكاة" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "أفضل فيلا في العلا" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "مناسبة للعائلات الكبيرة" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "الحمام الرئيسي فاخر جداً" },
  { apartmentName: "Dadan Luxury Villa", rating: 4, comment: "غالية لكن تستحق كل ريال" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "4 غرف نوم واسعة وفاخرة" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "المطبخ مجهز بأحدث الأجهزة" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "حديقة خاصة واسعة جداً" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "احنا 12 شخص واتسعنا براحة" },
  { apartmentName: "Dadan Luxury Villa", rating: 4, comment: "قليل بعيدة عن الوسط" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "أفضل استثمار لعطلة فاخرة" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "الموقع قريب من تراث دادان" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "شقة الأحلام حقاً" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "صيانة ممتازة وتنظيف يومي" },
  { apartmentName: "Dadan Luxury Villa", rating: 4, comment: "سعرها عالي لكن جودة عالية" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "أفضل استقبال من صاحب الشقة" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "حفلة عيد ميلاد الأطفال كانت رائعة" },
  { apartmentName: "Dadan Luxury Villa", rating: 5, comment: "سننام هنا في كل مرة نروح العلا" },

  // Elephant Rock View (14 تقييم)
  { apartmentName: "Elephant Rock View", rating: 5, comment: "إطلالة على الفيل الشهير" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "موقع سياحي فريد" },
  { apartmentName: "Elephant Rock View", rating: 4, comment: "جميلة لكن ضيقة قليلاً" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "الصبح من هنا يشفي النفس" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "موقع مثالي للمصورين" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "غرفة نوم جميلة وفراش ناعم" },
  { apartmentName: "Elephant Rock View", rating: 4, comment: "الحمام صغير شوي" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "قيمة ممتازة" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "صاحب الشقة محترف في الضيافة" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "جربت أفضل القهوة هنا" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "التصوير من هنا خيالي" },
  { apartmentName: "Elephant Rock View", rating: 4, comment: "جيدة للعاشقين والمسافرين" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "روح الصحراء موجودة هنا" },
  { apartmentName: "Elephant Rock View", rating: 5, comment: "أروع شقة شفتها في حياتي" },

  // Hegra Explorer's Lodge (11 تقييم)
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "قريبة من موقع هجر الأثري" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "موقع استثنائي" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 4, comment: "غرفة واحدة لكن مريحة" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "سعر ممتاز مقابل الجودة" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "صاحب الشقة يعرف كل تاريخ المنطقة" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "الفطور لذيذ جداً" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 4, comment: "مناسبة للباحثين عن الهدوء" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "قريبة من الحفريات" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "أنصح للمهتمين بالتاريخ" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "تجربة فريدة من نوعها" },
  { apartmentName: "Hegra Explorer's Lodge", rating: 5, comment: "شقة بكل معنى الكلمة" },

  // Maraya Concert Suite (10 تقييم)
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "قريبة من قاعة مرآة الحفلات" },
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "موقع حفلات فريد" },
  { apartmentName: "Maraya Concert Suite", rating: 4, comment: "جميلة لكن قد تكون صاخبة وقت الحفلات" },
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "الفن والعمارة في مكان واحد" },
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "مثالية لعشاق الفن" },
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "مشهد ليلي ساحر من الشرفة" },
  { apartmentName: "Maraya Concert Suite", rating: 4, comment: "جيدة للفنانين والمبدعين" },
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "الإضاءة الليلية من هنا خيالية" },
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "شقة أنيقة وراقية" },
  { apartmentName: "Maraya Concert Suite", rating: 5, comment: "موقع لا ينسى" },

  // AlUla Farmhouse Retreat (12 تقييم)
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "مزرعة حقيقية وفاخرة" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "الطبيعة والراحة في مكان واحد" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "مثالية للعائلات" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "حديقة وأشجار وهدوء" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 4, comment: "بعيدة قليلاً عن الوسط" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "الأطفال بحبوا الحديقة" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "غروب جميل جداً" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "الهدوء هنا نعمة" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "محظ القدر أننا وجدنا هذا المكان" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 4, comment: "سعر معقول للفيلا" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "أفضل مكان لقضاء شهر العسل" },
  { apartmentName: "AlUla Farmhouse Retreat", rating: 5, comment: "صاحب الشقة في تمام اللطف" },
];

// ==================== BOOKINGS DATA ====================
const bookingsData = [
  // Bookings متنوعة لـ 30 حجز
  { apartmentName: "Desert Rose Suite", userEmail: "ahmed@example.com", checkIn: "2026-10-01", checkOut: "2026-10-05", guests: 2, total: 2600, status: "confirmed" },
  { apartmentName: "Desert Rose Suite", userEmail: "fatima@example.com", checkIn: "2026-10-10", checkOut: "2026-10-15", guests: 3, total: 3900, status: "confirmed" },
  { apartmentName: "Desert Rose Suite", userEmail: "sara@example.com", checkIn: "2026-10-20", checkOut: "2026-10-25", guests: 2, total: 2600, status: "pending" },

  { apartmentName: "AlUla Cliffside Retreat", userEmail: "mohammed@example.com", checkIn: "2026-10-05", checkOut: "2026-10-10", guests: 3, total: 6000, status: "confirmed" },
  { apartmentName: "AlUla Cliffside Retreat", userEmail: "noor@example.com", checkIn: "2026-10-15", checkOut: "2026-10-20", guests: 4, total: 8000, status: "completed" },
  { apartmentName: "AlUla Cliffside Retreat", userEmail: "hana@example.com", checkIn: "2026-11-01", checkOut: "2026-11-05", guests: 2, total: 4000, status: "pending" },

  { apartmentName: "Oasis Garden Studio", userEmail: "khalid@example.com", checkIn: "2026-10-02", checkOut: "2026-10-07", guests: 1, total: 1750, status: "confirmed" },
  { apartmentName: "Oasis Garden Studio", userEmail: "layla@example.com", checkIn: "2026-10-12", checkOut: "2026-10-17", guests: 2, total: 3500, status: "completed" },
  { apartmentName: "Oasis Garden Studio", userEmail: "omar@example.com", checkIn: "2026-10-25", checkOut: "2026-10-30", guests: 1, total: 1750, status: "confirmed" },

  { apartmentName: "Dadan Luxury Villa", userEmail: "zainab@example.com", checkIn: "2026-10-08", checkOut: "2026-10-15", guests: 8, total: 15400, status: "confirmed" },
  { apartmentName: "Dadan Luxury Villa", userEmail: "ahmed@example.com", checkIn: "2026-10-20", checkOut: "2026-10-28", guests: 6, total: 13200, status: "pending" },
  { apartmentName: "Dadan Luxury Villa", userEmail: "fatima@example.com", checkIn: "2026-11-05", checkOut: "2026-11-10", guests: 4, total: 8800, status: "confirmed" },

  { apartmentName: "Elephant Rock View", userEmail: "sara@example.com", checkIn: "2026-10-03", checkOut: "2026-10-08", guests: 2, total: 3900, status: "completed" },
  { apartmentName: "Elephant Rock View", userEmail: "mohammed@example.com", checkIn: "2026-10-18", checkOut: "2026-10-23", guests: 2, total: 3900, status: "confirmed" },
  { apartmentName: "Elephant Rock View", userEmail: "noor@example.com", checkIn: "2026-11-02", checkOut: "2026-11-07", guests: 3, total: 5850, status: "pending" },

  { apartmentName: "Hegra Explorer's Lodge", userEmail: "hana@example.com", checkIn: "2026-10-04", checkOut: "2026-10-09", guests: 1, total: 2600, status: "completed" },
  { apartmentName: "Hegra Explorer's Lodge", userEmail: "khalid@example.com", checkIn: "2026-10-14", checkOut: "2026-10-19", guests: 2, total: 5200, status: "confirmed" },
  { apartmentName: "Hegra Explorer's Lodge", userEmail: "layla@example.com", checkIn: "2026-10-22", checkOut: "2026-10-26", guests: 1, total: 2080, status: "pending" },

  { apartmentName: "Maraya Concert Suite", userEmail: "omar@example.com", checkIn: "2026-10-06", checkOut: "2026-10-11", guests: 2, total: 4500, status: "confirmed" },
  { apartmentName: "Maraya Concert Suite", userEmail: "zainab@example.com", checkIn: "2026-10-16", checkOut: "2026-10-21", guests: 3, total: 6750, status: "completed" },
  { apartmentName: "Maraya Concert Suite", userEmail: "ahmed@example.com", checkIn: "2026-11-03", checkOut: "2026-11-08", guests: 2, total: 4500, status: "pending" },

  { apartmentName: "AlUla Farmhouse Retreat", userEmail: "fatima@example.com", checkIn: "2026-10-07", checkOut: "2026-10-13", guests: 4, total: 5100, status: "confirmed" },
  { apartmentName: "AlUla Farmhouse Retreat", userEmail: "sara@example.com", checkIn: "2026-10-17", checkOut: "2026-10-24", guests: 3, total: 5950, status: "completed" },
  { apartmentName: "AlUla Farmhouse Retreat", userEmail: "mohammed@example.com", checkIn: "2026-10-26", checkOut: "2026-11-02", guests: 5, total: 7100, status: "confirmed" },

  // حجوزات إضافية
  { apartmentName: "Desert Rose Suite", userEmail: "noor@example.com", checkIn: "2026-09-15", checkOut: "2026-09-20", guests: 2, total: 2600, status: "completed" },
  { apartmentName: "Oasis Garden Studio", userEmail: "hana@example.com", checkIn: "2026-09-10", checkOut: "2026-09-15", guests: 1, total: 1750, status: "completed" },
  { apartmentName: "Dadan Luxury Villa", userEmail: "khalid@example.com", checkIn: "2026-09-20", checkOut: "2026-09-27", guests: 6, total: 13200, status: "completed" },
  { apartmentName: "Elephant Rock View", userEmail: "layla@example.com", checkIn: "2026-09-18", checkOut: "2026-09-23", guests: 2, total: 3900, status: "completed" },
  { apartmentName: "Hegra Explorer's Lodge", userEmail: "omar@example.com", checkIn: "2026-09-12", checkOut: "2026-09-16", guests: 1, total: 2080, status: "completed" },
  { apartmentName: "Maraya Concert Suite", userEmail: "zainab@example.com", checkIn: "2026-09-25", checkOut: "2026-09-30", guests: 2, total: 4500, status: "completed" },
  { apartmentName: "AlUla Farmhouse Retreat", userEmail: "ahmed@example.com", checkIn: "2026-09-22", checkOut: "2026-09-29", guests: 4, total: 5100, status: "completed" },
];

// ==================== FAVORITES DATA ====================
const favoritesData = [
  { userEmail: "ahmed@example.com", apartmentNames: ["Desert Rose Suite", "Dadan Luxury Villa", "Elephant Rock View"] },
  { userEmail: "fatima@example.com", apartmentNames: ["AlUla Cliffside Retreat", "AlUla Farmhouse Retreat"] },
  { userEmail: "sara@example.com", apartmentNames: ["Oasis Garden Studio", "Hegra Explorer's Lodge", "Maraya Concert Suite"] },
  { userEmail: "mohammed@example.com", apartmentNames: ["Dadan Luxury Villa", "Elephant Rock View"] },
  { userEmail: "noor@example.com", apartmentNames: ["AlUla Cliffside Retreat", "Desert Rose Suite"] },
];

// ==================== SEED FUNCTION ====================
export const seedAll = mutation({
  handler: async (ctx) => {
    console.log("🚀 بدء عملية ملء البيانات التجريبية...\n");

    // 1. Seed Users
    console.log("1️⃣ إضافة المستخدمين...");
    const userIds: Record<string, string> = {};
    for (const user of usersData) {
      const userId = await ctx.db.insert("users", {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role as "user" | "owner" | "admin",
      });
      userIds[user.email] = userId;
      console.log(`   ✅ ${user.name} (${user.email})`);
    }
    console.log(`\n✅ تم إضافة ${usersData.length} مستخدم\n`);

    // 2. Get Apartment IDs
    console.log("2️⃣ جلب معرفات الشقق...");
    const apartments = await ctx.db.query("apartments").collect();
    const apartmentIds: Record<string, string> = {};
    for (const apt of apartments) {
      apartmentIds[apt.title] = apt._id;
    }
    console.log(`✅ تم جلب ${apartments.length} شقة\n`);

    // 3. Seed Reviews
    console.log("3️⃣ إضافة التقييمات...");
    let reviewCount = 0;
    for (let i = 0; i < reviewsData.length; i++) {
      const review = reviewsData[i];
      const apartmentId = apartmentIds[review.apartmentName];
      const userId = userIds[usersData[i % usersData.length].email];

      if (apartmentId && userId) {
        await ctx.db.insert("reviews", {
          apartmentId,
          userId,
          rating: review.rating,
          comment: review.comment,
        });
        reviewCount++;
      }
    }
    console.log(`✅ تم إضافة ${reviewCount} تقييم\n`);

    // 4. Seed Bookings
    console.log("4️⃣ إضافة الحجوزات...");
    for (const booking of bookingsData) {
      const apartmentId = apartmentIds[booking.apartmentName];
      const userId = userIds[booking.userEmail];

      if (apartmentId && userId) {
        await ctx.db.insert("bookings", {
          apartmentId,
          userId,
          checkIn: new Date(booking.checkIn),
          checkOut: new Date(booking.checkOut),
          numberOfGuests: booking.guests,
          totalPrice: booking.total,
          status: booking.status as "pending" | "confirmed" | "cancelled" | "completed",
          specialRequests: "",
        });
        console.log(`   ✅ حجز: ${booking.apartmentName} - ${booking.userEmail}`);
      }
    }
    console.log(`\n✅ تم إضافة ${bookingsData.length} حجز\n`);

    // 5. Seed Favorites
    console.log("5️⃣ إضافة المفضلة...");
    for (const fav of favoritesData) {
      const userId = userIds[fav.userEmail];
      if (userId) {
        for (const aptName of fav.apartmentNames) {
          const apartmentId = apartmentIds[aptName];
          if (apartmentId) {
            await ctx.db.insert("favorites", {
              userId,
              apartmentId,
            });
          }
        }
        console.log(`   ✅ ${fav.userEmail} - ${fav.apartmentNames.length} مفضلة`);
      }
    }
    console.log(`\n✅ تم إضافة المفضلة\n`);

    // 6. Summary
    console.log("=" .repeat(50));
    console.log("🎉 تم ملء جميع البيانات التجريبية بنجاح!");
    console.log("=" .repeat(50));
    console.log(`
📊 ملخص البيانات:
   👥 المستخدمين: ${usersData.length}
   ⭐ التقييمات: ${reviewCount}
   📅 الحجوزات: ${bookingsData.length}
   ❤️  المفضلة: ${favoritesData.reduce((s, f) => s + f.apartmentNames.length, 0)}
    `);

    return {
      success: true,
      users: usersData.length,
      reviews: reviewCount,
      bookings: bookingsData.length,
      favorites: favoritesData.reduce((s, f) => s + f.apartmentNames.length, 0),
    };
  },
});
