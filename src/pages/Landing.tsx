import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { ApartmentCarousel } from "@/components/apartments/ApartmentCarousel";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { DEMO_MODE, DEMO_APARTMENTS } from "@/lib/demo-data";
import { Link, useNavigate } from "react-router";
import type { ApartmentRecord } from "@/types/apartment";
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
} from "lucide-react";

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

  // Search state
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCheckIn, setSearchCheckIn] = useState("");
  const [searchCheckOut, setSearchCheckOut] = useState("");
  const [searchGuests, setSearchGuests] = useState(2);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (searchCheckIn) params.set("checkIn", searchCheckIn);
    if (searchCheckOut) params.set("checkOut", searchCheckOut);
    if (searchGuests > 1) params.set("guests", String(searchGuests));
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
        {/* Background Image of AlUla with warm gradient overlay */}
        <div className="relative w-full h-[380px] sm:h-[440px] md:h-[480px]">
          <img
            src="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1800&q=85&auto=format&fit=crop"
            alt="طبيعة وجبال العلا الساحرة"
            className="w-full h-full object-cover object-center brightness-75 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-black/40 to-black/30 dark:from-[#15100C] dark:via-black/60" />

          {/* Welcome Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-4 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-3 bg-black/30 backdrop-blur-md px-5 py-2 rounded-full border border-white/20"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm">عُ</span>
              </div>
              <span className="text-white font-bold text-sm tracking-wide">
                منصة شقق وإقامات العلا المعتمدة
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight mb-2"
            >
              حيّا الله في العلا
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-xl text-white/90 font-medium drop-shadow-md max-w-xl"
            >
              وين ودّك تقضي إقامتك بين الجبال والواحات؟
            </motion.p>
          </div>
        </div>

        {/* ─── Floating Search Capsule (Centered over Hero bottom) ─── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
          <motion.form
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSearchSubmit}
            className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl p-3 sm:p-4 rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
              {/* الوجهة */}
              <div className="md:col-span-4 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[var(--clay-accent-soft)] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[var(--clay-accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 block">
                    الوجهة أو الحي
                  </span>
                  <select
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full bg-transparent text-sm font-extrabold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer truncate"
                  >
                    <option value="">جميع مناطق ومعالم العلا</option>
                    {(liveLocations ?? []).map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden md:block w-px h-8 bg-neutral-200 dark:bg-neutral-800" />

              {/* التواريخ */}
              <div className="md:col-span-4 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[var(--clay-gold-soft)] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[var(--clay-gold)]" />
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 block">
                      الوصول
                    </span>
                    <input
                      type="date"
                      value={searchCheckIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSearchCheckIn(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 block">
                      المغادرة
                    </span>
                    <input
                      type="date"
                      value={searchCheckOut}
                      min={searchCheckIn || new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSearchCheckOut(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="hidden md:block w-px h-8 bg-neutral-200 dark:bg-neutral-800" />

              {/* الضيوف */}
              <div className="md:col-span-2 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 block">
                    الضيوف
                  </span>
                  <select
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-extrabold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "ضيف" : "ضيوف"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* زر البحث */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-[var(--clay-accent)] via-[#D4A574] to-[var(--clay-accent)] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[var(--clay-accent)]/25 hover:opacity-95 active:scale-98 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>بحث</span>
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </section>

      {/* ─── Circular Destinations ("في كل زاوية من العلا لك إقامة" - Gathern Style) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            في كل زاوية من العلا لك إقامة
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
            title="اسكن حول المعالم التراثية (الحِجر ودادان)"
            subtitle="شقق وأجنحة في قلب عبق التاريخ والبلدة القديمة"
            apartments={heritageApartments}
            onViewAll={() => navigate("/apartments")}
          />
        )}

        {/* الصف الثاني: أجنحة بإطلالات جبلية وصخرة الفيل */}
        {mountainApartments.length > 0 && (
          <ApartmentCarousel
            title="أجنحة بإطلالات جبلية وصخرة الفيل"
            subtitle="إطلالات ساحرة على تشكيلات صخور وجبال العلا الصحراوية"
            apartments={mountainApartments}
            onViewAll={() => navigate("/apartments")}
          />
        )}

        {/* الصف الثالث: إقامات واحة النخيل */}
        {oasisApartments.length > 0 && (
          <ApartmentCarousel
            title="إقامات قلب واحة النخيل والهدوء"
            subtitle="استوديوهات وشاليهات وسط بساتين النخيل والحمضيات"
            apartments={oasisApartments}
            onViewAll={() => navigate("/apartments")}
          />
        )}

        {/* الصف الرابع: فلل ملكية ومزارع بمسابح خاصة */}
        {luxuryVillas.length > 0 && (
          <ApartmentCarousel
            title="فلل ملكية ومزارع بمسابح خاصة"
            subtitle="مساحات رحبة وخصوصية تامة للعائلات والمجموعات"
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
                لأصحاب العقارات والشقق في العلا
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mb-2">
                تبي تعرض وحدتك أو عقارك للإيجار؟
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                انضم إلى نخبة مضيفي شقق العلا، واستقبل زوار وسياح العلا من كافة أنحاء العالم مع نظام دفع إلكتروني آمن ودعم مستمر.
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
                مرخص ومعتمد رسمياً
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                شقق مرخصة ومطابقة لاشتراطات وزارة السياحة
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                دفع إلكتروني آمن
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                مدى، Apple Pay، فيزا وماستركارد بأمان تام
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                تأكيد حجز فوري
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                رمز حجز مباشر مع تفاصيل الوصول للموقع
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
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">عُ</span>
                </div>
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
                منصة حجز وإدارة شقق وإقامات العلا الأولى. تجربة ضيافة سعودية فريدة بإطلالات ساحرة على التاريخ والطبيعة.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/50">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>مرخصة سياحياً لخدمات الإيواء السياحي بالعلا</span>
              </div>
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
                <span>📧 {siteSettings?.contactEmail || "info@soqaqalaula.world"}</span>
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
