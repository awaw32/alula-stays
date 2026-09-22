import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    // Check if reviews already exist
    const existing = await ctx.db.query("reviews").first();
    if (existing) return "Reviews already seeded";

    const apartments = await ctx.db.query("apartments").collect();
    if (apartments.length === 0) return "No apartments found — seed apartments first";

    const existingSeedUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "seed@alula-stays.local"))
      .first();
    const seedUserId = existingSeedUser?._id ?? (await ctx.db.insert("users", {
      name: "زائر تجريبي",
      email: "seed@alula-stays.local",
      isAnonymous: true,
      role: "user",
    }));

    const reviewData = [
      { aptTitle: "Desert Rose Suite", name: "محمد العتيبي", rating: 5, comment: "تجربة رائعة! الشقة نظيفة جداً والموقع مثالي لاستكشاف العلا. الإطلالة على الواحة كانت خلابة. بالتأكيد سأعود مرة أخرى." },
      { aptTitle: "Desert Rose Suite", name: "سارة القحطاني", rating: 5, comment: "أجمل شقة أقام فيها في العلا. التصميم الداخلي يجمع بين العصرية والتراثية بشكل مبهر. المطبخ مجهز بالكامل." },
      { aptTitle: "Desert Rose Suite", name: "Ahmed K.", rating: 4, comment: "Beautiful apartment with amazing views. The check-in process was smooth and the host was very responsive. Highly recommended!" },
      { aptTitle: "Cliffside Retreat", name: "فهد المالكي", rating: 5, comment: "ملاذ حقيقي! المنظر من الجبل لا يوصف. المسبح والشواء مميزان جداً. الشقة واسعة ومناسبة للعائلات." },
      { aptTitle: "Cliffside Retreat", name: "نورة السبيعي", rating: 5, comment: "Exceptional stay. The cave-inspired design is unique and the stargazing deck was magical. Worth every riyal." },
      { aptTitle: "Oasis Garden", name: "عبدالله الحربي", rating: 5, comment: "أفضل استوديو في العلا! الموقع في قلب المدينة القديمة والحديقة الخاصة هادئة ومريحة. القهوة العربية عند الوصول لمسة جميلة." },
      { aptTitle: "Oasis Garden", name: "ليلى العنزي", rating: 4, comment: "موقع ممتاز قريب من كل شيء. الشقة صغيرة لكنها مريحة ونظيفة. أوصي بها للأزواج." },
      { aptTitle: "Dadan Luxury", name: "خالد الدوسري", rating: 5, comment: "فيلا فاخرة بكل ما تحمله الكلمة من معنى. المسبح اللانهائي مع الإطلالة على الآثار تجربة لا تُنسى." },
      { aptTitle: "Elephant Rock", name: "ريم الشمري", rating: 5, comment: "صخرة الفيل من الشرفة مباشرة! التصميم مميز والألوان تعكس جمال العلا. سقف المراقبة للنجوم رائع." },
      { aptTitle: "Elephant Rock", name: "Omar M.", rating: 4, comment: "Great location near Elephant Rock. The apartment is stylish and comfortable. Only minor issue was WiFi speed during peak hours." },
      { aptTitle: "Hegra Explorer", name: "سلطان المطيري", rating: 5, comment: "تجربة فريدة بالقرب من الحِجر. التصميم النبطي رائع والموقع مثالي لعشاق المغامرة." },
      { aptTitle: "Maraya Concert", name: "هند الغامدي", rating: 4, comment: "موقع مميز بالقرب من ماريا. التصميم الفني جميل والشقة مريحة. الحفلات في ماريا قريبة جداً." },
      { aptTitle: "Farmhouse Retreat", name: "يوسف الزهراني", rating: 5, comment: "أجمل تجربة عائلية في العلا. المزرعة ساحرة والأطفال أحبوا قطف الأعشاب الطازجة. المجلس الخارجي مثالي للمساء." },
    ];

    let count = 0;
    for (const review of reviewData) {
      const apt = apartments.find((a) => a.title.includes(review.aptTitle));
      if (apt) {
        await ctx.db.insert("reviews", {
          apartmentId: apt._id,
          userId: seedUserId,
          userName: review.name,
          rating: review.rating,
          comment: review.comment,
          createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
        count++;
      }
    }

    return `Seeded ${count} reviews`;
  },
});
