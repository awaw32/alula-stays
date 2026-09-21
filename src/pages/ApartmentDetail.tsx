import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useParams, Link, useNavigate } from "react-router";
import {
  Star,
  MapPin,
  Bed,
  Bath,
  Users,
  Maximize,
  CheckCircle,
  Trophy,
  Heart,
  Sparkles,
  ArrowRight,
  Calendar,
  Wifi,
  Car,
  UtensilsCrossed,
  Wind,
  Mountain,
  Waves,
  WashingMachine,
  Tv,
  Flame,
  Dumbbell,
  Film,
  Coffee,
  TreePalm,
  Telescope,
  Church,
  X,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const amenityMap: Record<string, { icon: typeof Wifi; label: string }> = {
  wifi: { icon: Wifi, label: "واي فاي" },
  parking: { icon: Car, label: "مواقف سيارات" },
  kitchen: { icon: UtensilsCrossed, label: "مطبخ مجهز" },
  ac: { icon: Wind, label: "تكييف" },
  mountain_view: { icon: Mountain, label: "إطلالة جبلية" },
  pool: { icon: Waves, label: "مسبح" },
  washer: { icon: WashingMachine, label: "غسالة" },
  tv: { icon: Tv, label: "تلفزيون" },
  bbq: { icon: Flame, label: "شواء" },
  gym: { icon: Dumbbell, label: "صالة رياضية" },
  terrace: { icon: TreePalm, label: "شرفة" },
  garden: { icon: TreePalm, label: "حديقة" },
  coffee_maker: { icon: Coffee, label: "قهوة" },
  cinema: { icon: Film, label: "سينما" },
  firepit: { icon: Flame, label: "مدفأة" },
  stargazing: { icon: Telescope, label: "مراقبة نجوم" },
  majlis: { icon: Church, label: "مجلس" },
};

const badgeConfig: Record<string, { label: string; icon: typeof Trophy; color: string }> = {
  top_rated: {
    label: "الأعلى تقييماً",
    icon: Trophy,
    color: "bg-amber-100 text-amber-700",
  },
  verified: {
    label: "موثقة",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-700",
  },
  premium: {
    label: "مميزة",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-700",
  },
  guest_favorite: {
    label: "مفضلة الضيوف",
    icon: Heart,
    color: "bg-rose-100 text-rose-700",
  },
  new: {
    label: "جديدة",
    icon: Sparkles,
    color: "bg-sky-100 text-sky-700",
  },
};

export default function ApartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apartment = useQuery(
    api.apartments.get,
    id ? { apartmentId: id as any } : "skip",
  );
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (apartment === undefined) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="clay animate-pulse">
            <div className="aspect-[16/9] bg-[var(--clay-surface)] rounded-t-[1.5rem]" />
            <div className="p-6 space-y-4">
              <div className="h-6 bg-[var(--clay-surface)] rounded-full w-1/2" />
              <div className="h-4 bg-[var(--clay-surface)] rounded-full w-1/3" />
              <div className="h-20 bg-[var(--clay-surface)] rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (apartment === null) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">الشقة غير موجودة</h2>
          <p className="text-[var(--muted-foreground)] mb-6">
            عذراً، الشقة التي تبحث عنها غير موجودة أو تم حذفها
          </p>
          <Link to="/apartments" className="clay-btn">
            تصفح الشقق
          </Link>
        </div>
      </div>
    );
  }

  const displayBadges = (apartment.badges || [])
    .map((b) => badgeConfig[b])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        {/* Breadcrumb */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
            <Link to="/" className="hover:text-[var(--clay-accent)] transition-colors">
              الرئيسية
            </Link>
            <span>/</span>
            <Link to="/apartments" className="hover:text-[var(--clay-accent)] transition-colors">
              الشقق
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)] font-medium truncate max-w-[200px]">
              {apartment.title}
            </span>
          </div>
        </motion.div>

        {/* Image Gallery */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <div className="clay overflow-hidden mb-8">
            {/* Main Image */}
            <div
              className="relative aspect-[16/9] md:aspect-[21/9] bg-[var(--clay-surface)] cursor-pointer overflow-hidden rounded-t-[1.5rem]"
              onClick={() => setShowLightbox(true)}
            >
              <img
                src={apartment.images[selectedImage]}
                alt={apartment.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {displayBadges.length > 0 && (
                <div className="absolute top-4 left-4 flex gap-2">
                  {displayBadges.map((badge, i) => (
                    <span
                      key={i}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.color}`}
                    >
                      <badge.icon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 p-3 overflow-x-auto">
              {apartment.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i
                      ? "border-[var(--clay-accent)] shadow-md"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Location */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
              <div className="clay p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
                      {apartment.title}
                    </h1>
                    <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                      <MapPin className="w-4 h-4" />
                      <span>{apartment.location}</span>
                      {apartment.isVerified && (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          موثقة
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-[var(--clay-accent-soft)] px-3 py-1.5 rounded-xl">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[var(--foreground)]">
                      {apartment.rating}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      ({apartment.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5">
                    <Bed className="w-4 h-4" />
                    {apartment.bedrooms} غرفة نوم
                  </span>
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5">
                    <Bath className="w-4 h-4" />
                    {apartment.bathrooms} حمام
                  </span>
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5">
                    <Users className="w-4 h-4" />
                    حتى {apartment.maxGuests} ضيوف
                  </span>
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5">
                    <Maximize className="w-4 h-4" />
                    {apartment.area} م²
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
              <div className="clay p-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
                  عن الشقة
                </h2>
                <p className="text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                  {apartment.description}
                </p>
              </div>
            </motion.div>

            {/* Amenities */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
              <div className="clay p-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
                  المرافق والتجهيزات
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {apartment.amenities.map((amenity) => {
                    const config = amenityMap[amenity];
                    const Icon = config?.icon || Sparkles;
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 clay-inset px-4 py-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[var(--clay-accent-soft)] flex items-center justify-center shrink-0">
                          <Icon className="w-4.5 h-4.5 text-[var(--clay-accent)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {config?.label || amenity.replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Rules */}
            {apartment.rules && apartment.rules.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
                <div className="clay p-6">
                  <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
                    قواعد الإقامة
                  </h2>
                  <ul className="space-y-2">
                    {apartment.rules.map((rule, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--clay-accent)] shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Map Placeholder */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
              <div className="clay p-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
                  الموقع على الخريطة
                </h2>
                <div className="clay-inset aspect-[16/9] rounded-2xl flex items-center justify-center overflow-hidden">
                  {apartment.latitude && apartment.longitude ? (
                    <iframe
                      title="Apartment Location"
                      className="w-full h-full border-0 rounded-2xl"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${apartment.longitude - 0.02}%2C${apartment.latitude - 0.02}%2C${apartment.longitude + 0.02}%2C${apartment.latitude + 0.02}&layer=mapnik&marker=${apartment.latitude}%2C${apartment.longitude}`}
                    />
                  ) : (
                    <div className="text-center text-[var(--muted-foreground)]">
                      <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{apartment.location}</p>
                    </div>
                  )}
                </div>
                {apartment.latitude && apartment.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${apartment.latitude},${apartment.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="clay-btn-outline inline-flex items-center gap-2 text-sm mt-4"
                  >
                    احصل على الاتجاهات
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="sticky top-24"
            >
              <div className="clay p-6">
                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-[var(--clay-accent)]">
                    {apartment.price.toLocaleString()}
                  </span>
                  <span className="text-lg font-medium text-[var(--muted-foreground)]">
                    ر.س
                  </span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    / ليلة
                  </span>
                </div>

                {/* Rating summary */}
                <div className="flex items-center gap-2 mb-6 clay-inset px-4 py-3">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-[var(--foreground)]">
                    {apartment.rating}
                  </span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    · {apartment.reviewCount} تقييم
                  </span>
                </div>

                {/* Date picker placeholder */}
                <div className="space-y-3 mb-6">
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    <Calendar className="w-4 h-4 inline ml-1.5" />
                    تاريخ الوصول والمغادرة
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      className="clay-input text-sm text-center"
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <input
                      type="date"
                      className="clay-input text-sm text-center"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                    <Users className="w-4 h-4 inline ml-1.5" />
                    عدد الضيوف
                  </label>
                  <div className="clay-inset px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    حتى {apartment.maxGuests} ضيوف
                  </div>
                </div>

                {/* CTA */}
                <button className="clay-btn w-full text-center text-lg py-3.5">
                  احجز الآن
                </button>

                <p className="text-xs text-center text-[var(--muted-foreground)] mt-3">
                  لن يتم خصم أي مبلغ حتى تأكيد الحجز
                </p>

                {/* Quick info */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
                  {[
                    { icon: Bed, text: `${apartment.bedrooms} غرفة نوم` },
                    { icon: Bath, text: `${apartment.bathrooms} حمام` },
                    { icon: Users, text: `حتى ${apartment.maxGuests} ضيوف` },
                    { icon: Maximize, text: `${apartment.area} متر مربع` },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white z-10"
            onClick={() => setShowLightbox(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={apartment.images[selectedImage]}
            alt={apartment.title}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
          />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {apartment.images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(i);
                }}
                className={`w-12 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === i
                    ? "border-white scale-110"
                    : "border-white/30 opacity-60"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
