import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const seed = mutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("apartments").first();
    if (existing) return "Already seeded";

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

    const apartments = [
      {
        title: "Desert Rose Suite — AlUla Heritage Village",
titleAr: "جناح وردة الصحراء — قرية العلا التراثية",
        description:
          "A stunning 2-bedroom apartment nestled in the heart of AlUla's Heritage Village. Floor-to-ceiling windows frame breathtaking views of the ancient sandstone formations. The interior blends modern comfort with traditional Najdi architectural elements — think hand-carved wooden details, earthy terracotta tones, and soft linen fabrics. The open-plan living area flows onto a private terrace overlooking the Oasis. Includes a fully equipped kitchen with premium appliances, spa-inspired bathrooms with rainfall showers, and high-speed WiFi. Perfect for families exploring Hegra, AlUla Old Town, and Dadan.",
        descriptionAr:
          "شقة مذهلة من غرفتي نوم تقع في قلب قرية العلا التراثية. نوافذ من الأرض إلى السقف تframe مناظر خلابة للتكوينات الحجرية الرملية القديمة.",
        price: 650,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 6,
        area: 110,
        location: "Heritage Village",
        locationAr: "القرية التراثية",
        latitude: 26.6172,
        longitude: 37.9158,
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "parking", "kitchen", "ac", "mountain_view", "terrace", "washer", "tv"],
        rating: 4.9,
        reviewCount: 127,
        isVerified: true,
        isFeatured: true,
        badges: ["top_rated", "verified"],
        rules: ["No smoking", "No pets", "Check-in from 3 PM"],
        rulesAr: ["ممنوع التدخين", "ممنوع الحيوانات الأليفة", "تسجيل الدخول من الساعة 3 عصراً"],
        available: true,
      },
      {
        title: "AlUla Cliffside Retreat — Views of Jabal Ithlib",
        titleAr: "ملاذ شرفات العلا — إطلالة على جبل عِصر",
        description:
          "Perched on the dramatic sandstone cliffs overlooking the ancient Nabataean corridor, this luxurious 3-bedroom retreat offers unparalleled views of Jabal Ithlib. The apartment features a unique cave-inspired design with curved walls, ambient lighting, and natural stone accents. The master suite includes a freestanding copper bathtub positioned to capture sunset views. A state-of-the-art kitchen, expansive living room with projection cinema, and a rooftop stargazing deck complete this extraordinary stay.",
        descriptionAr:
          "تقع على المنحدرات الحجرية الرملية المثيرة المطلة على الممر النبطي القديم، وتوفر هذا الملاذ الفاخر من غرف النوم الثلاثة إطلالة لا مثيل لها على جبل عِصر.",
        price: 1200,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 8,
        area: 180,
        location: "Jabal Ithlib",
        locationAr: "جبل عِصر",
        latitude: 26.7833,
        longitude: 37.9667,
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "parking", "kitchen", "ac", "mountain_view", "pool", "washer", "tv", "bbq", "gym"],
        rating: 4.8,
        reviewCount: 89,
        isVerified: true,
        isFeatured: true,
        badges: ["premium", "verified"],
        rules: ["No smoking inside", "No parties after 11 PM", "Maximum 8 guests"],
        rulesAr: ["ممنوع التدخين في الداخل", "ممنوع الحفلات بعد الساعة 11 مساءً", "الحد الأقصى 8 أشخاص"],
        available: true,
      },
      {
        title: "Oasis Garden Studio — AlUla Old Town",
titleAr: "ستوديو حديقة الواحة — ديرة العلا القديمة",
        description:
          "A charming studio apartment in the heart of AlUla Old Town, steps away from ancient alleyways and traditional souqs. This intimate space is perfect for solo travelers or couples seeking an authentic AlUla experience. The apartment features hand-painted ceramic tiles, a cozy sleeping loft, and a private garden courtyard with date palms and a small fountain.",
        descriptionAr: "شقة استوديو ساحرة في قلب ديرة العلا القديمة، على بُعد خطوات من الأزقة القديمة والأسواق التقليدية.",
        price: 350,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        area: 45,
        location: "AlUla Old Town",
        locationAr: "ديرة العلا القديمة",
        latitude: 26.6153,
        longitude: 37.9217,
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "kitchen", "ac", "garden", "coffee_maker"],
        rating: 4.7,
        reviewCount: 203,
        isVerified: true,
        isFeatured: true,
        badges: ["top_rated", "guest_favorite"],
        rules: ["No smoking", "Quiet hours after 10 PM"],
        rulesAr: ["ممنوع التدخين", "ساعات الهدوء بعد الساعة 10 مساءً"],
        available: true,
      },
      {
        title: "Dadan Luxury Villa — Private Pool & Garden",
        titleAr: "فيلا دادان الفاخرة — مسبح وحديقة خاصة",
        description:
          "An opulent 4-bedroom villa in the prestigious Dadan district, offering absolute privacy and luxury. The property features a temperature-controlled infinity pool overlooking the ancient Dadanite kingdom ruins, manicured desert gardens with native plants, and a full outdoor entertainment area with BBQ and firepit.",
        descriptionAr: "فيلا فاخرة من أربع غرف نوم في حي دادان الراقي، توفر الخصوصية المطلقة والرفاهية.",
        price: 2200,
        bedrooms: 4,
        bathrooms: 5,
        maxGuests: 10,
        area: 320,
        location: "Dadan",
        locationAr: "دادان",
        latitude: 26.77,
        longitude: 37.95,
        images: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "parking", "kitchen", "ac", "pool", "garden", "bbq", "washer", "tv", "gym", "cinema", "firepit"],
        rating: 4.95,
        reviewCount: 56,
        isVerified: true,
        isFeatured: true,
        badges: ["premium", "verified", "top_rated"],
        rules: ["No smoking inside", "No parties", "Pool hours 8 AM - 10 PM", "Maximum 10 guests"],
        rulesAr: ["ممنوع التدخين في الداخل", "ممنوع الحفلات", "ساعات المسبح من 8 صباحاً حتى 10 مساءً", "الحد الأقصى 10 أشخاص"],
        available: true,
      },
      {
        title: "Elephant Rock View Apartment",
        titleAr: "شقة إطلالة على صخرة الفيل",
        description:
          "Wake up to the iconic Elephant Rock right outside your window. This stylish 2-bedroom apartment combines contemporary desert aesthetics with comfort. The open-concept living space features floor-to-ceiling glass panels, terracotta accent walls, and handwoven Saudi textiles.",
        descriptionAr: "استيقظ على صخرة الفيل الأيقونية خارج نافذتك مباشرة. هذه الشقة الأنيقة من غرفتي نوم تجمع بين جماليات الصحراء المعاصرة والراحة.",
        price: 780,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 5,
        area: 95,
        location: "Elephant Rock",
        locationAr: "صخرة الفيل",
        latitude: 26.71,
        longitude: 37.93,
        images: [
          "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "parking", "kitchen", "ac", "mountain_view", "terrace", "washer", "tv", "coffee_maker"],
        rating: 4.85,
        reviewCount: 164,
        isVerified: true,
        isFeatured: true,
        badges: ["verified", "guest_favorite"],
        rules: ["No smoking", "No pets", "Check-in from 2 PM"],
        rulesAr: ["ممنوع التدخين", "ممنوع الحيوانات الأليفة", "تسجيل الدخول من الساعة 2 عصراً"],
        available: true,
      },
      {
        title: "Hegra Explorer's Lodge — Near Archaeological Site",
        titleAr: "نزل مستكشف الحِجر — بالقرب من الموقع الأثري",
        description:
          "Designed for the adventurous spirit, this earthy 1-bedroom lodge sits just 10 minutes from the Hegra Archaeological Site (Saudi Arabia's first UNESCO World Heritage Site). The interiors celebrate Nabataean craftsmanship with carved stone walls, copper lanterns, and a collection of local art.",
        descriptionAr: "مصمم للروح المغامرة، هذا النزل الترابي من غرفة نوم واحدة يقع على بُعد 10 دقائق فقط من الموقع الأثري للحِجر.",
        price: 520,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 3,
        area: 65,
        location: "Hegra",
        locationAr: "الحِجر",
        latitude: 26.7847,
        longitude: 37.95,
        images: [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "parking", "kitchen", "ac", "terrace", "coffee_maker", "stargazing"],
        rating: 4.75,
        reviewCount: 78,
        isVerified: true,
        isFeatured: false,
        badges: ["verified"],
        rules: ["No smoking", "Respect the heritage site"],
        rulesAr: ["ممنوع التدخين", "احترم الموقع التراثي"],
        available: true,
      },
      {
        title: "Maraya Concert Suite — AlUla Arts District",
titleAr: "جناح مارايا الموسيقي — حي الفنون في العلا",
        description:
          "Located in the vibrant AlUla Arts District near the world-famous Maraya concert hall, this chic 2-bedroom suite is perfect for culture enthusiasts. The apartment features a gallery-inspired design with rotating local artwork, a vinyl record collection, and a dedicated music listening corner.",
descriptionAr: "تقع في حي الفنون النابض بالحياة بالقرب من قاعة مارايا الشهيرة عالمياً، هذه الجناح الأنيق من غرفتي نوم مثالي لمحبي الثقافة.",
        price: 900,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        area: 88,
        location: "AlUla Arts District",
        locationAr: "حي الفنون",
        latitude: 26.63,
        longitude: 37.91,
        images: [
          "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "parking", "kitchen", "ac", "terrace", "tv", "washer", "coffee_maker"],
        rating: 4.6,
        reviewCount: 112,
        isVerified: true,
        isFeatured: false,
        badges: ["verified", "new"],
        rules: ["No smoking", "No loud music after midnight"],
        rulesAr: ["ممنوع التدخين", "ممنوع الموسيقى العالية بعد منتصف الليل"],
        available: true,
      },
      {
        title: "AlUla Farmhouse Retreat — Organic Garden Living",
        titleAr: "ملاذ المزرعة في العلا — حياة الحديقة العضوية",
        description:
          "Escape to this charming 3-bedroom farmhouse on the outskirts of AlUla, surrounded by ancient date palm groves and organic gardens. The property retains traditional Hejazi architecture with thick stone walls, wooden lattice windows (mashrabiya), and a central courtyard.",
        descriptionAr: "اهرب إلى هذا المزرعة الساحرة من غرف النوم الثلاثة على مشارف العلا، محاطة بحقول النخيل القديمة والحدائق العضوية.",
        price: 850,
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 8,
        area: 200,
        location: "AlUla Oasis",
        locationAr: "واحة العلا",
        latitude: 26.62,
        longitude: 37.905,
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
        ],
        amenities: ["wifi", "parking", "kitchen", "garden", "pool", "bbq", "majlis", "coffee_maker"],
        rating: 4.88,
        reviewCount: 91,
        isVerified: true,
        isFeatured: false,
        badges: ["verified", "guest_favorite"],
        rules: ["No smoking inside", "Respect the garden", "No pets"],
        rulesAr: ["ممنوع التدخين في الداخل", "احترم الحديقة", "ممنوع الحيوانات الأليفة"],
        available: true,
      },
    ];

    const aptIds: Id<"apartments">[] = [];
    for (const apartment of apartments) {
      const id = await ctx.db.insert("apartments", { ...apartment, available: true });
      aptIds.push(id);
    }

    // Seed reviews
    const reviewData = [
      { aptIdx: 0, name: "محمد العتيبي", rating: 5, comment: "تجربة رائعة! الشقة نظيفة جداً والموقع مثالي لاستكشاف العلا. الإطلالة على الواحة كانت خلابة. بالتأكيد سأعود مرة أخرى." },
      { aptIdx: 0, name: "سارة القحطاني", rating: 5, comment: "أجمل شقة أقام فيها في العلا. التصميم الداخلي يجمع بين العصرية والتراثية بشكل مبهر. المطبخ مجهز بالكامل." },
      { aptIdx: 0, name: "Ahmed K.", rating: 4, comment: "Beautiful apartment with amazing views. The check-in process was smooth and the host was very responsive. Highly recommended!" },
      { aptIdx: 1, name: "فهد المالكي", rating: 5, comment: "ملاذ حقيقي! المنظر من الجبل لا يُوصف. المسبح والشواء مميزان جداً. الشقة واسعة ومناسبة للعائلات." },
      { aptIdx: 1, name: "نورة السبيعي", rating: 5, comment: ".Exceptional stay. The cave-inspired design is unique and the stargazing deck was magical. Worth every riyal." },
      { aptIdx: 2, name: "عبدالله الحربي", rating: 5, comment: "أفضل استوديو في العلا! الموقع في قلب المدينة القديمة والحديقة الخاصة هادئة ومريحة. القهوة العربية عند الوصول لمسة جميلة." },
      { aptIdx: 2, name: "ليلى العنزي", rating: 4, comment: "موقع ممتاز قريب من كل شيء. الشقة صغيرة لكنها مريحة ونظيفة. أوصي بها للأزواج." },
      { aptIdx: 3, name: "خالد الدوسري", rating: 5, comment: "فيلا فاخرة بكل ما تحمله الكلمة من معنى. المسبح اللانهائي مع الإطلالة على الآثار تجربة لا تُنسى. مناسبة للاحتفالات." },
      { aptIdx: 4, name: "ريم الشمري", rating: 5, comment: "صخرة الفيل من الشرفة مباشرة! التصميم مميز والألوان تعكس جمال العلا. سقف المراقبة للنجوم رائع." },
      { aptIdx: 4, name: "Omar M.", rating: 4, comment: "Great location near Elephant Rock. The apartment is stylish and comfortable. Only minor issue was WiFi speed during peak hours." },
      { aptIdx: 5, name: "سلطان المطيري", rating: 5, comment: "تجربة فريدة بالقرب من الحِجر. التصميم النبطي رائع والموقع مثالي لعشاق المغامرة. المقرمشات العربية ممتازة." },
      { aptIdx: 6, name: "هند الغامدي", rating: 4, comment: "موقع مميز بالقرب من ماريا. التصميم الفني جميل والشقة مريحة. الحفلات في ماريا قريبة جداً." },
        { aptIdx: 7, name: "يوسف الزهراني", rating: 5, comment: "أجمل تجربة عائلية في العلا. المزرعة ساحرة والأطفال أحبوا قطف الأعشاب الطازجة. المجلس الخارجي مثالي للمساء." },
    ];

    for (const review of reviewData) {
      await ctx.db.insert("reviews", {
        apartmentId: aptIds[review.aptIdx],
        userId: seedUserId,
        userName: review.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // random date in last 30 days
      });
    }

    return `Seeded ${apartments.length} apartments and ${reviewData.length} reviews`;
  },
});
