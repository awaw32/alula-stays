import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { ApartmentCarousel } from "@/components/apartments/ApartmentCarousel";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { DEMO_MODE, DEMO_APARTMENTS } from "@/lib/demo-data";
import { Link, useNavigate } from "react-router";
import type { ApartmentRecord } from "@/types/apartment";
import { cn } from "@/lib/utils";
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  CreditCard,
  Lock,
  Users,
  ChevronDown,
  X,
} from "lucide-react";

const HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=1800&q=85&auto=format&fit=crop",
    title: "جبل الفيل وتكوينات العلا الصخرية الساحرة",
  },
  {
    url: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=1800&q=85&auto=format&fit=crop",
    title: "آثار الحِجر ومدائن صالح التاريخية",
  },
  {
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1800&q=85&auto=format&fit=crop",
    title: "واحات ونخيل العلا الغنّاء بين الجبال",
  },
  {
    url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1800&q=85&auto=format&fit=crop",
    title: "جبال وسهول العلا الخلابة في لحظات الغروب",
  },
];

const alUlaDestinations = [
  {
    id: "old-town",
    name: "ديرة العلا القديمة",
    location: "AlUla Old Town",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=240&h=240&fit=crop",
  },
  {
    id: "elephant-rock",
    name: "صخرة الفيل",
    location: "Elephant Rock",
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=240&h=240&fit=crop",
  },
  {
    id: "hegra",
    name: "الحِجر (مدائن صالح)",
    location: "Hegra",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=240&h=240&fit=crop",
  },
  {
    id: "dadan",
    name: "مملكة دادان",
    location: "Dadan",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=240&h=240&fit=crop",
  },
  {
    id: "oasis",
    name: "واحة النخيل",
    location: "AlUla Oasis",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=240&h=240&fit=crop",
  },
  {
    id: "arts",
    name: "حي الفنون (الجديدة)",
    location: "AlUla Arts District",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=240&h=240&fit=crop",
  },
  {
    id: "sharaan",
    name: "جبال شرعان",
    location: "Jabal Ithlib",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=240&h=240&fit=crop",
  },
  {
    id: "stars",
    name: "رصد النجوم",
    location: "Heritage Village",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=240&h=240&fit=crop",
  },
];

export default function Landing() {
  const liveApartments = useQuery(
    api.apartments.list,
    DEMO_MODE ? "skip" : {},
  );
  const liveLocations = useQuery(
    api.apartments.locations,
    DEMO_MODE ? "skip" : undefined,
  );
  const apartments: ApartmentRecord[] = DEMO_MODE
    ? DEMO_APARTMENTS
    : (liveApartments as ApartmentRecord[]) ?? [];

  const siteSettings = useQuery(api.settings.get, {});
  const navigate = useNavigate();

  // Hero background slideshow timer
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Search state
  const [searchLocation, setSearchLocation] = useState("");
  const [searchPropertyType, setSearchPropertyType] = useState("");
  const [searchCheckIn, setSearchCheckIn] = useState("");
  const [searchCheckOut, setSearchCheckOut] = useState("");
  const [searchGuests, setSearchGuests] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const unitTypes = useMemo(
    () => [
      { value: "", label: "شقق، استوديو، غرف، فلل" },
      { value: "apartment", label: "شقق واستوديوهات" },
      { value: "chalet", label: "شاليهات واستراحات" },
      { value: "villa", label: "فلل ومزارع بمسابح" },
      { value: "camp", label: "مخيمات وكرفانات" },
    ],
    [],
  );

  const formatArabicDayDate = (date: Date) => {
    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const dateDisplayString = useMemo(() => {
    if (searchCheckIn && searchCheckOut) {
      const dIn = new Date(searchCheckIn);
      const dOut = new Date(searchCheckOut);
      return `${formatArabicDayDate(dIn)} ← ${formatArabicDayDate(dOut)}`;
    }
    if (searchCheckIn) {
      const dIn = new Date(searchCheckIn);
      return `${formatArabicDayDate(dIn)} ← حدد المغادرة`;
    }
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    return `${formatArabicDayDate(today)} ← ${formatArabicDayDate(tomorrow)}`;
  }, [searchCheckIn, searchCheckOut]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (searchPropertyType) params.set("type", searchPropertyType);
    if (searchCheckIn) params.set("checkIn", searchCheckIn);
    if (searchCheckOut) params.set("checkOut", searchCheckOut);
    if (searchGuests > 0) params.set("guests", String(searchGuests));
    navigate(`/apartments${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Curated Collections (Gathern Rows)
  const heritageApartments = useMemo(() => {
    return apartments.filter(
      (a) =>
        a.location === "Hegra" ||
        a.location === "Dadan" ||
        a.location === "Heritage Village" ||
        a.location === "AlUla Old Town",
    );
  }, [apartments]);

  const mountainApartments = useMemo(() => {
    return apartments.filter(
      (a) =>
        a.location === "Elephant Rock" ||
        a.location === "Jabal Ithlib" ||
        a.amenities.includes("mountain_view"),
    );
  }, [apartments]);

  const oasisApartments = useMemo(() => {
    return apartments.filter(
      (a) =>
        a.location === "AlUla Oasis" ||
        a.amenities.includes("garden") ||
        a.titleAr?.includes("واحة"),
    );
  }, [apartments]);

  const luxuryVillas = useMemo(() => {
    return apartments.filter(
      (a) =>
        a.price >= 650 ||
        a.amenities.includes("pool") ||
        (a.bedrooms && a.bedrooms >= 3),
    );
  }, [apartments]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#15100C] text-[var(--foreground)] pb-24 md:pb-12">
      <Navigation />

      {/* ─── Hero Section with Saudi Welcome Banner (Gathern Style) ─── */}
      <section className="relative overflow-hidden">
        {/* Background Slideshow of AlUla with warm gradient overlay */}
        <div className="relative w-full h-[370px] sm:h-[430px] md:h-[470px] overflow-hidden">
          {HERO_IMAGES.map((img, idx) => (
            <div
              key={img.url}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                idx === currentBgIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none",
              )}
              style={{ transitionProperty: "opacity, transform", transitionDuration: "1200ms" }}
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover object-center brightness-75 contrast-105"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-black/40 to-black/30 dark:from-[#15100C] dark:via-black/60" />

          {/* Welcome Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-4 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-3 bg-black/30 backdrop-blur-md px-5 py-2 rounded-full border border-white/20"
            >
              <img
                src="/logo-icon.png"
                alt="شقق العلا"
                className="w-7 h-7 object-contain drop-shadow"
              />
              <span className="text-white font-bold text-sm tracking-wide">
                {siteSettings?.heroBadge || "منصة شقق وإقامات العلا المعتمدة"}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight mb-2"
            >
              {siteSettings?.heroTitle || "حيّا الله في العلا"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-xl text-white/90 font-medium drop-shadow-md max-w-xl"
            >
              {siteSettings?.heroSubtitle || "وين ودّك تقضي إقامتك بين الجبال والواحات؟"}
            </motion.p>
          </div>
        </div>

        {/* ─── Floating Search Capsule (Matching Gathern Luxury Image Exactly) ─── */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
          <motion.form
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSearchSubmit}
            className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 p-2 sm:p-3"
          >
            {/* ── واجهة الجوال الفاخرة المدمجة (نفس الحقول بوضوح تام ودون رموز إنجليزية) ── */}
            <div className="block md:hidden space-y-2">
              {/* السطر الأول: اختر المدينة + نوع الوحدة جنباً إلى جنب */}
              <div className="grid grid-cols-2 gap-2">
                {/* اختر المدينة */}
                <div className="relative p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                  <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 leading-tight">
                    اختر المدينة
                  </span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 truncate">
                      {searchLocation ? searchLocation : "العلا"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                  <select
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="">العلا (جميع المناطق)</option>
                    <option value="AlUla Old Town">ديرة العلا القديمة</option>
                    <option value="Elephant Rock">صخرة الفيل</option>
                    <option value="Hegra">الحِجر (مدائن صالح)</option>
                    <option value="Dadan">مملكة دادان</option>
                    <option value="AlUla Oasis">واحة النخيل</option>
                    <option value="AlUla Arts District">حي الفنون (الجديدة)</option>
                    <option value="Jabal Ithlib">جبال شرعان</option>
                    {(liveLocations ?? []).map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* نوع الوحدة */}
                <div className="relative p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                  <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 leading-tight">
                    نوع الوحدة
                  </span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 truncate">
                      {unitTypes.find((u) => u.value === searchPropertyType)?.label || "شقق، استوديو..."}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                  <select
                    value={searchPropertyType}
                    onChange={(e) => setSearchPropertyType(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    {unitTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* السطر الثاني: تاريخ الحجز بالعربي الصريح بدون أي حروف إنجليزية أو رموز المتصفح */}
              <div
                onClick={() => setShowDatePicker(true)}
                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 cursor-pointer active:scale-99 transition-transform"
              >
                <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 leading-tight">
                  تاريخ الحجز
                </span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 truncate">
                    {dateDisplayString}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </div>
              </div>

              {/* السطر الثالث: عدد الضيوف بجانب زر البحث البنفسجي الفاخر */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                  <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 leading-tight">
                    عدد الضيوف
                  </span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 truncate">
                      {searchGuests > 0 ? `${searchGuests} ضيوف` : "حدد عدد الضيوف"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                  <select
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value={0}>حدد عدد الضيوف</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "ضيف" : "ضيوف"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* زر البحث البنفسجي */}
                <button
                  type="submit"
                  className="w-12 h-12 rounded-xl bg-[#542382] hover:bg-[#431969] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                  aria-label="بحث"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* ── واجهة الشاشات المتوسطة والكبيرة (مطابقة لصورة جاذر إن 100%) ── */}
            <div className="hidden md:flex items-center justify-between divide-x divide-x-reverse divide-neutral-200/80 dark:divide-neutral-800">
              {/* 1. اختر المدينة */}
              <div className="relative flex-1 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-2xl transition-colors cursor-pointer group">
                <span className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-0.5">
                  اختر المدينة
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-black text-neutral-900 dark:text-neutral-100 truncate">
                    {searchLocation ? searchLocation : "العلا"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform" />
                </div>
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="اختر المدينة"
                >
                  <option value="">العلا (جميع المناطق)</option>
                  <option value="AlUla Old Town">ديرة العلا القديمة</option>
                  <option value="Elephant Rock">صخرة الفيل</option>
                  <option value="Hegra">الحِجر (مدائن صالح)</option>
                  <option value="Dadan">مملكة دادان</option>
                  <option value="AlUla Oasis">واحة النخيل</option>
                  <option value="AlUla Arts District">حي الفنون (الجديدة)</option>
                  <option value="Jabal Ithlib">جبال شرعان</option>
                  {(liveLocations ?? [])
                    .filter(
                      (loc) =>
                        ![
                          "AlUla Old Town",
                          "Elephant Rock",
                          "Hegra",
                          "Dadan",
                          "AlUla Oasis",
                          "AlUla Arts District",
                          "Jabal Ithlib",
                        ].includes(loc),
                    )
                    .map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                </select>
              </div>

              {/* 2. نوع الوحدة */}
              <div className="relative flex-[1.1] px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-2xl transition-colors cursor-pointer group">
                <span className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-0.5">
                  نوع الوحدة
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-black text-neutral-900 dark:text-neutral-100 truncate">
                    {unitTypes.find((u) => u.value === searchPropertyType)?.label || "شقق، استوديو، غرف، فلل"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform" />
                </div>
                <select
                  value={searchPropertyType}
                  onChange={(e) => setSearchPropertyType(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="نوع الوحدة"
                >
                  {unitTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. تاريخ الحجز */}
              <div
                onClick={() => setShowDatePicker(true)}
                className="flex-[1.5] px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-2xl transition-colors cursor-pointer group"
              >
                <span className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-0.5">
                  تاريخ الحجز
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-black text-neutral-900 dark:text-neutral-100 truncate">
                    {dateDisplayString}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform shrink-0" />
                </div>
              </div>

              {/* 4. عدد الضيوف */}
              <div className="relative flex-1 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-2xl transition-colors cursor-pointer group">
                <span className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-0.5">
                  عدد الضيوف
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-black text-neutral-900 dark:text-neutral-100 truncate">
                    {searchGuests > 0 ? `${searchGuests} ضيوف` : "حدد عدد الضيوف"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform" />
                </div>
                <select
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="عدد الضيوف"
                >
                  <option value={0}>حدد عدد الضيوف</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "ضيف" : "ضيوف"}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. زر البحث البنفسجي الفخم كما في الصورة */}
              <div className="pr-3 pl-1">
                <button
                  type="submit"
                  className="w-12 h-12 rounded-2xl bg-[#542382] hover:bg-[#431969] text-white flex items-center justify-center shadow-lg shadow-[#542382]/25 active:scale-95 transition-all cursor-pointer shrink-0"
                  aria-label="بحث"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.form>

          {/* ─── نافذة اختيار التواريخ المنبثقة (Date Picker Modal) ─── */}
          {showDatePicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-right">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#542382]" />
                    <h3 className="font-black text-base text-neutral-900 dark:text-neutral-100">
                      تحديد تواريخ الإقامة في العلا
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      تاريخ الوصول
                    </label>
                    <input
                      type="date"
                      value={searchCheckIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSearchCheckIn(e.target.value)}
                      className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#542382]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      تاريخ المغادرة
                    </label>
                    <input
                      type="date"
                      value={searchCheckOut}
                      min={searchCheckIn || new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSearchCheckOut(e.target.value)}
                      className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#542382]"
                    />
                  </div>

                  {/* اختصارات تواريخ سريعة */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const tomorrow = new Date(now.getTime() + 86400000);
                        const dayAfter = new Date(now.getTime() + 86400000 * 2);
                        setSearchCheckIn(tomorrow.toISOString().split("T")[0]);
                        setSearchCheckOut(dayAfter.toISOString().split("T")[0]);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
                    >
                      غداً (ليلة واحدة)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const dayOfWeek = now.getDay();
                        const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
                        const thursday = new Date(now.getTime() + daysUntilThursday * 86400000);
                        const saturday = new Date(thursday.getTime() + 86400000 * 2);
                        setSearchCheckIn(thursday.toISOString().split("T")[0]);
                        setSearchCheckOut(saturday.toISOString().split("T")[0]);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
                    >
                      عطلة نهاية الأسبوع (الخميس - السبت)
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="w-full py-3 rounded-xl bg-[#542382] text-white font-black text-sm shadow-md hover:bg-[#431969] transition-colors"
                  >
                    تأكيد التواريخ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Circular Destinations ("في كل زاوية من العلا لك إقامة" - Gathern Style) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            {siteSettings?.destinationsTitle || "في كل زاوية من العلا لك إقامة"}
          </h2>
          <Link
            to="/apartments"
            className="text-xs font-bold text-[var(--clay-accent)] hover:underline"
          >
            استكشف الخريطة
          </Link>
        </div>

        <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
          {alUlaDestinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => navigate(`/apartments?location=${encodeURIComponent(dest.location)}`)}
              className="group cursor-pointer flex flex-col items-center gap-2 shrink-0 transition-transform hover:-translate-y-1"
            >
              <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full p-0.5 bg-gradient-to-tr from-[var(--clay-accent)] to-[var(--clay-gold)] shadow-md group-hover:shadow-xl transition-all">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-neutral-900 bg-neutral-200">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 text-center max-w-[90px] leading-tight group-hover:text-[var(--clay-accent)] transition-colors">
                {dest.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Curated Carousels (Gathern Style Rows) ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-2">
        {/* الصف الأول: اسكن حول المعالم التراثية */}
        {heritageApartments.length > 0 && (
          <ApartmentCarousel
            title={siteSettings?.heritageSectionTitle || "اسكن حول المعالم التراثية (الحِجر ودادان)"}
            subtitle={siteSettings?.heritageSectionSubtitle || "شقق وأجنحة في قلب عبق التاريخ والبلدة القديمة"}
            apartments={heritageApartments}
            onViewAll={() => navigate("/apartments")}
          />
        )}

        {/* الصف الثاني: أجنحة بإطلالات جبلية وصخرة الفيل */}
        {mountainApartments.length > 0 && (
          <ApartmentCarousel
            title={siteSettings?.mountainSectionTitle || "أجنحة بإطلالات جبلية وصخرة الفيل"}
            subtitle={siteSettings?.mountainSectionSubtitle || "إطلالات ساحرة على تشكيلات صخور وجبال العلا الصحراوية"}
            apartments={mountainApartments}
            onViewAll={() => navigate("/apartments")}
          />
        )}

        {/* الصف الثالث: إقامات واحة النخيل */}
        {oasisApartments.length > 0 && (
          <ApartmentCarousel
            title={siteSettings?.oasisSectionTitle || "إقامات قلب واحة النخيل والهدوء"}
            subtitle={siteSettings?.oasisSectionSubtitle || "استوديوهات وشاليهات وسط بساتين النخيل والحمضيات"}
            apartments={oasisApartments}
            onViewAll={() => navigate("/apartments")}
          />
        )}

        {/* الصف الرابع: فلل ملكية ومزارع بمسابح خاصة */}
        {luxuryVillas.length > 0 && (
          <ApartmentCarousel
            title={siteSettings?.villasSectionTitle || "فلل ملكية ومزارع بمسابح خاصة"}
            subtitle={siteSettings?.villasSectionSubtitle || "مساحات رحبة وخصوصية تامة للعائلات والمجموعات"}
            apartments={luxuryVillas}
            onViewAll={() => navigate("/apartments")}
          />
        )}
      </div>

      {/* ─── Host Gateway Banner (بوابة المضيفين - Gathern Style) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2A1F17] via-[#3D2B1F] to-[#2A1F17] text-white p-6 sm:p-10 shadow-2xl border border-amber-900/40">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-right max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                {siteSettings?.hostBannerBadge || "لأصحاب العقارات والشقق في العلا"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mb-2">
                {siteSettings?.hostBannerTitle || "تبي تعرض وحدتك أو عقارك للإيجار؟"}
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                {siteSettings?.hostBannerSubtitle || "انضم إلى نخبة مضيفي شقق العلا، واستقبل زوار وسياح العلا من كافة أنحاء العالم مع نظام دفع إلكتروني آمن ودعم مستمر."}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                to="/add-apartment"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--clay-accent)] to-[var(--clay-gold)] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-102 transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>أضف عقارك الآن</span>
              </Link>
              <Link
                to="/owner"
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/20 transition-colors"
              >
                <span>بوابة المضيفين</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Ministry of Tourism & Trust Bar ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {siteSettings?.trustFeature1Title || "مرخص ومعتمد رسمياً"}
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {siteSettings?.trustFeature1Desc || "شقق مرخصة ومطابقة لاشتراطات وزارة السياحة"}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {siteSettings?.trustFeature2Title || "دفع إلكتروني آمن"}
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {siteSettings?.trustFeature2Desc || "مدى، Apple Pay، فيزا وماستركارد بأمان تام"}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {siteSettings?.trustFeature3Title || "تأكيد حجز فوري"}
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {siteSettings?.trustFeature3Desc || "رمز حجز مباشر مع تفاصيل الوصول للموقع"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src="/logo-icon.png"
                  alt="شقق العلا"
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                    شقق العلا
                  </span>
                  <span className="block text-[10px] text-neutral-400 -mt-1 tracking-wider">
                    ALULA STAYS
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                {siteSettings?.footerDescription || "منصة حجز وإدارة شقق وإقامات العلا الأولى. تجربة ضيافة سعودية فريدة بإطلالات ساحرة على التاريخ والطبيعة."}
              </p>
              {siteSettings?.isTourismLicensed && siteSettings?.tourismLicenseNumber && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/50">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>مرخصة سياحياً برقم ترخيص: {siteSettings.tourismLicenseNumber}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-3">
                روابط سريعة
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/apartments", label: "تصفح جميع الشقق" },
                  { href: "/add-apartment", label: "أضف عقارك كشريك" },
                  { href: "/owner", label: "بوابة المضيفين" },
                  { href: "/auth", label: "تسجيل الدخول / إنشاء حساب" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-[var(--clay-accent)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-3">
                تواصل معنا
              </h4>
              <div className="flex flex-col gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>📍 العلا، المملكة العربية السعودية</span>
                <span>📧 {siteSettings?.contactEmail || "info@alulahome.com"}</span>
                <span>📱 {siteSettings?.contactPhone && !siteSettings.contactPhone.includes("XX") ? siteSettings.contactPhone : "+966 50 123 4567"}</span>
                {siteSettings?.whatsapp && <span>💬 واتساب: {siteSettings.whatsapp}</span>}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap justify-between items-center gap-4 text-xs text-neutral-400">
            <div className="flex flex-wrap gap-4">
              <Link to="/legal/about" className="hover:text-neutral-700 dark:hover:text-neutral-200">من نحن</Link>
              <Link to="/legal/terms" className="hover:text-neutral-700 dark:hover:text-neutral-200">الشروط والأحكام</Link>
              <Link to="/legal/privacy" className="hover:text-neutral-700 dark:hover:text-neutral-200">سياسة الخصوصية</Link>
              <Link to="/legal/cancellation" className="hover:text-neutral-700 dark:hover:text-neutral-200">سياسة الإلغاء</Link>
            </div>
            <span>© {new Date().getFullYear()} شقق العلا. جميع الحقوق محفوظة.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
