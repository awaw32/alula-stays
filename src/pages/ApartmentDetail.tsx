import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { getApartmentDescription, getApartmentLocation, getApartmentRules, getApartmentTitle, formatArabicDate, getAmenityLabel } from "@/lib/apartment-content";
import { DEMO_MODE, DEMO_APARTMENTS } from "@/lib/demo-data";
import { calculateStayPrice } from "@/lib/pricing";
import { getErrorMessage } from "@/lib/error-message";
import { toast } from "sonner";
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
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

type BookingSuccess = {
  bookingId: Id<"bookings">;
  totalPrice: number;
  platformFee: number;
  totalNights: number;
};

function parseDateInput(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateInput(date: Date | null) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  top_rated: { label: "الأعلى تقييماً", icon: Trophy, color: "bg-amber-100 text-amber-700" },
  verified: { label: "موثقة", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  premium: { label: "مميزة", icon: Sparkles, color: "bg-purple-100 text-purple-700" },
  guest_favorite: { label: "مفضلة الضيوف", icon: Heart, color: "bg-rose-100 text-rose-700" },
  new: { label: "جديدة", icon: Sparkles, color: "bg-sky-100 text-sky-700" },
};

function StarRating({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function ApartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apartmentId = id as Id<"apartments"> | undefined;
  const liveApartment = useQuery(api.apartments.get, DEMO_MODE || !apartmentId ? "skip" : { apartmentId });
  const liveReviews = useQuery(api.reviews.list, DEMO_MODE || !apartmentId ? "skip" : { apartmentId });
  const liveFavorited = useQuery(api.favorites.isFavorited, DEMO_MODE || !apartmentId ? "skip" : { apartmentId });
  const apartment = DEMO_MODE ? (DEMO_APARTMENTS.find((a) => a._id === id) ?? null) : liveApartment;
  const reviews = DEMO_MODE ? [] : liveReviews;
  const isFavorited = DEMO_MODE ? false : liveFavorited;
  const toggleFavorite = useMutation(api.favorites.toggle);
  const createReport = useMutation(api.reports.create);
  const getOrCreateConversation = useMutation(api.messages.getOrCreate);
  const createBooking = useMutation(api.bookings.create);
  const createReview = useMutation(api.reviews.create);
  const createCheckoutSession = useAction(api.payments.createCheckoutSession);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);

  const liveAvailability = useQuery(
    api.bookings.checkAvailability,
    DEMO_MODE || !apartmentId || !checkIn || !checkOut
      ? "skip"
      : { apartmentId, checkIn: checkIn.getTime(), checkOut: checkOut.getTime() },
  );
  const availability = DEMO_MODE ? { available: true } : liveAvailability;

  // التواريخ غير المتاحة (محجوزة أو محجوبة من المالك) — لتحذير الضيف قبل الاختيار
  const liveUnavailable = useQuery(
    api.calendar.unavailableDates,
    DEMO_MODE || !apartmentId ? "skip" : { apartmentId },
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // تفصيل التسعير الحقيقي: أسعار نهاية الأسبوع + الحد الأدنى للليالي
  const stayBreakdown =
    checkIn && checkOut && apartment
      ? calculateStayPrice(
          checkIn.getTime(),
          checkOut.getTime(),
          apartment.price,
          (apartment as { weekendPrice?: number }).weekendPrice,
        )
      : null;
  const totalNights = stayBreakdown?.totalNights ?? 0;
  const totalPrice = stayBreakdown?.totalPrice ?? 0;
  const platformFee = Math.round(totalPrice * 0.1);
  const minNights = (apartment as { minNights?: number } | null)?.minNights ?? 1;
  const nightsBelowMin = totalNights > 0 && totalNights < minNights;

  const handleBooking = async () => {
    if (DEMO_MODE) { toast.error("الوضع التجريبي: اربط Convex لتفعيل الحجز."); return; }
    if (!checkIn || !checkOut || !apartmentId) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const result = await createBooking({
        apartmentId,
        checkIn: checkIn.getTime(),
        checkOut: checkOut.getTime(),
        guests,
      });
      setBookingSuccess(result);
      toast.success("تم إنشاء الحجز، جارٍ تحويلك إلى الدفع");
      const checkout = await createCheckoutSession({ bookingId: result.bookingId });
      if (checkout.url) {
        window.location.assign(checkout.url);
      }
    } catch (error) {
      const message = getErrorMessage(error, "حدث خطأ أثناء إنشاء الحجز");
      setBookingError(message);
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReview = async () => {
    if (DEMO_MODE) { toast.error("الوضع التجريبي: اربط Convex لإرسال التقييم."); return; }
    if (!apartmentId || !reviewComment.trim()) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      await createReview({
        apartmentId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      toast.success("تم إرسال تقييمك بنجاح");
    } catch (error) {
      const message = getErrorMessage(error, "حدث خطأ أثناء إرسال التقييم");
      setReviewError(message);
      toast.error(message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (DEMO_MODE) { toast.error("الوضع التجريبي: اربط Convex لحفظ المفضلة."); return; }
    if (!apartmentId) return;
    try {
      const result = await toggleFavorite({ apartmentId });
      toast.success(result.favorited ? "تمت إضافة الشقة إلى المفضلة" : "تمت إزالة الشقة من المفضلة");
    } catch {
      navigate(`/auth?returnTo=${encodeURIComponent(`/apartment/${id}`)}`);
    }
  };


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
          <Link to="/apartments" className="clay-btn">تصفح الشقق</Link>
        </div>
      </div>
    );
  }

  const displayBadges = (apartment.badges || []).map((b) => badgeConfig[b]).filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        {/* Breadcrumb */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <div className="mb-6 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Link to="/" className="transition-colors hover:text-[var(--clay-accent)]">الرئيسية</Link>
            <span>/</span>
            <Link to="/apartments" className="hover:text-[var(--clay-accent)] transition-colors">الشقق</Link>
            <span>/</span>
            <span className="max-w-[200px] truncate font-medium text-[var(--foreground)]">{getApartmentTitle(apartment)}</span>
          </div>
        </motion.div>

        {/* Image Gallery */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <div className="clay overflow-hidden mb-8">
            <div
              className="relative aspect-[16/9] md:aspect-[21/9] bg-[var(--clay-surface)] cursor-pointer overflow-hidden rounded-t-[1.5rem]"
              onClick={() => setShowLightbox(true)}
            >
              <img src={apartment.images[selectedImage]} alt={getApartmentTitle(apartment)} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              {displayBadges.length > 0 && (
                <div className="absolute top-4 left-4 flex gap-2">
                  {displayBadges.map((badge, i) => (
                    <span key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.color}`}>
                      <badge.icon className="w-3.5 h-3.5" />{badge.label}
                    </span>
                  ))}
                </div>
              )}
              {/* Favorite button */}
              <button
                onClick={(e) => { e.stopPropagation(); void handleFavorite(); }}
                 className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
                 aria-label={isFavorited ? "إزالة الشقة من المفضلة" : "إضافة الشقة إلى المفضلة"}
               >
                 <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} aria-hidden="true" />
              </button>
            </div>
            <div className="flex gap-2 p-3 overflow-x-auto">
               {apartment.images.map((img, i) => (
                 <button key={i} type="button" onClick={() => setSelectedImage(i)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${selectedImage === i ? "border-[var(--clay-accent)] shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`} aria-label={`عرض الصورة ${i + 1}`} aria-pressed={selectedImage === i}>
                   <img src={img} alt={`${getApartmentTitle(apartment)} - صورة ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Info */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
              <div className="clay p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)] md:text-3xl">{getApartmentTitle(apartment)}</h1>
                     <div className="flex flex-wrap items-center gap-2 text-[var(--muted-foreground)]">
                       <MapPin className="h-4 w-4" aria-hidden="true" /><span>{getApartmentLocation(apartment)}</span>
                      {(apartment as { latitude?: number; longitude?: number }).latitude != null && (apartment as { longitude?: number }).longitude != null && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${(apartment as { latitude?: number }).latitude}&mlon=${(apartment as { longitude?: number }).longitude}#map=15/${(apartment as { latitude?: number }).latitude}/${(apartment as { longitude?: number }).longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--clay-accent)] underline"
                        >
                          عرض على الخريطة ↗
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!apartmentId) return;
                          const reason = window.prompt("سبب البلاغ (بيانات غير دقيقة، صور غير لائقة، وصف مضلل، احتيال...):");
                          if (!reason?.trim()) return;
                          createReport({
                            targetType: "apartment",
                            targetId: apartmentId,
                            reason: "other",
                            details: reason.trim(),
                          })
                            .then((r) => toast.success(r.message))
                            .catch((err) => toast.error(getErrorMessage(err, "تعذر إرسال البلاغ")));
                        }}
                        className="text-xs text-[var(--muted-foreground)] hover:text-red-600 underline"
                      >
                        إبلاغ ⚑
                      </button>
                      {!DEMO_MODE && apartment.ownerId && (
                        <button
                          type="button"
                          onClick={() => {
                            getOrCreateConversation({ apartmentId })
                              .then((cid) => { window.location.assign(`/messages/${cid}`); })
                              .catch((err) => toast.error(getErrorMessage(err, "تعذر بدء المحادثة")));
                          }}
                          className="text-xs text-[var(--clay-accent)] underline"
                        >
                          💬 مراسلة المالك
                        </button>
                      )}
                      {apartment.isVerified && (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />موثقة
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-[var(--clay-accent-soft)] px-3 py-1.5 rounded-xl">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[var(--foreground)]">{apartment.rating}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">({apartment.reviewCount})</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5"><Bed className="w-4 h-4" />{apartment.bedrooms} غرفة نوم</span>
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5"><Bath className="w-4 h-4" />{apartment.bathrooms} حمام</span>
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5"><Users className="w-4 h-4" />حتى {apartment.maxGuests} ضيوف</span>
                  <span className="flex items-center gap-1.5 clay-sm px-3 py-1.5"><Maximize className="w-4 h-4" />{apartment.area} م²</span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
              <div className="clay p-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">عن الشقة</h2>
                <p className="whitespace-pre-line leading-relaxed text-[var(--muted-foreground)]">{getApartmentDescription(apartment)}</p>

                {/* تفاصيل الإقامة: أوقات، رسوم، قوانين */}
                {(() => {
                  const apt = apartment as typeof apartment & {
                    propertyType?: string; cleaningFee?: number; deposit?: number;
                    checkInTime?: string; checkOutTime?: string;
                    petsAllowed?: boolean; smokingAllowed?: boolean;
                    elevator?: boolean; wheelchairAccessible?: boolean;
                  };
                  const propertyLabels: Record<string, string> = {
                    apartment: "شقة", chalet: "شاليه", villa: "فيلا", camp: "مخيم",
                  };
                  const details: string[] = [];
                  if (apt.propertyType) details.push(`النوع: ${propertyLabels[apt.propertyType] ?? "شقة"}`);
                  if (apt.checkInTime) details.push(`تسجيل الوصول: ${apt.checkInTime}`);
                  if (apt.checkOutTime) details.push(`تسجيل المغادرة: ${apt.checkOutTime}`);
                  if (apt.cleaningFee) details.push(`رسوم التنظيف: ${apt.cleaningFee.toLocaleString()} ر.س (لمرة واحدة)`);
                  if (apt.deposit) details.push(`التأمين: ${apt.deposit.toLocaleString()} ر.س (مسترد)`);
                  if (apt.petsAllowed !== undefined) details.push(apt.petsAllowed ? "✓ يسمح بالحيوانات الأليفة" : "✗ لا يسمح بالحيوانات الأليفة");
                  if (apt.smokingAllowed !== undefined) details.push(apt.smokingAllowed ? "✓ يسمح بالتدخين" : "✗ ممنوع التدخين");
                  if (apt.elevator) details.push("✓ يوجد مصعد");
                  if (apt.wheelchairAccessible) details.push("✓ وصول لذوي الإعاقة");
                  const minN = (apartment as { minNights?: number }).minNights;
                  if (minN && minN > 1) details.push(`الحد الأدنى للإقامة: ${minN} ليالٍ`);
                  return details.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-[var(--border)] pt-4">
                      {details.map((d) => (
                        <span key={d} className="text-sm text-[var(--muted-foreground)] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--clay-accent)] shrink-0" />{d}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </motion.div>

            {/* Amenities */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
              <div className="clay p-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">المرافق والتجهيزات</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {apartment.amenities.map((amenity) => {
                    const config = amenityMap[amenity];
                    const Icon = config?.icon || Sparkles;
                    return (
                      <div key={amenity} className="flex items-center gap-3 clay-inset px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--clay-accent-soft)] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-[var(--clay-accent)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">{getAmenityLabel(amenity)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Rules */}
            {getApartmentRules(apartment).length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
                <div className="clay p-6">
                  <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">قواعد الإقامة</h2>
                  <ul className="space-y-2">
                    {getApartmentRules(apartment).map((rule, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--clay-accent)] shrink-0" />{rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Reviews Section */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
              <div className="clay p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[var(--foreground)]">آراء الضيوف</h2>
                  <button type="button" onClick={() => setShowReviewForm(!showReviewForm)} className="clay-btn flex items-center gap-2 px-4 py-2 text-sm" aria-expanded={showReviewForm} aria-controls="review-form">
                    <MessageSquare className="w-4 h-4" />أضف تقييم
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div id="review-form" className="clay-inset mb-4 p-4">
                    <div className="mb-3">
                      <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">تقييمك</label>
                      <StarRating rating={reviewRating} size="w-6 h-6" />
                          <input type="range" min={1} max={5} value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="mt-2 w-full accent-[var(--clay-accent)]" aria-label="تقييم الشقة من 1 إلى 5" />
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="اكتب تجربتك..." className="clay-input min-h-[100px] w-full resize-none text-sm" aria-label="تعليقك على الإقامة" />
                    {reviewError && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{reviewError}</p>}
                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={() => void handleReview()} disabled={reviewLoading || !reviewComment.trim()} className="clay-btn flex items-center gap-2 px-6 py-2 text-sm">
                        {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        إرسال
                      </button>
                      <button type="button" onClick={() => setShowReviewForm(false)} className="clay-btn-outline px-4 py-2 text-sm">إلغاء</button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews === undefined ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="clay-inset p-4 animate-pulse"><div className="h-4 bg-[var(--clay-surface)] rounded w-1/3 mb-2" /><div className="h-3 bg-[var(--clay-surface)] rounded w-full" /></div>)}
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-center text-[var(--muted-foreground)] py-6">لا توجد تقييمات بعد. كن أول من يقيم!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review._id} className="clay-inset p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--clay-accent-soft)] flex items-center justify-center text-sm font-bold text-[var(--clay-accent)]">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                              <span className="text-sm font-bold text-[var(--foreground)]">{review.userName}</span>
                          <span className="block text-xs text-[var(--muted-foreground)]">{formatArabicDate(review.createdAt)}</span>
                            </div>
                          </div>
                          <StarRating rating={review.rating} size="w-3.5 h-3.5" />
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Map */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}>
              <div className="clay p-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">الموقع على الخريطة</h2>
                  <div className="clay-inset flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl">
                  {apartment.latitude && apartment.longitude ? (
                    <iframe title="Apartment Location" className="w-full h-full border-0 rounded-2xl" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${apartment.longitude - 0.02}%2C${apartment.latitude - 0.02}%2C${apartment.longitude + 0.02}%2C${apartment.latitude + 0.02}&layer=mapnik&marker=${apartment.latitude}%2C${apartment.longitude}`} />
                  ) : (
                    <div className="text-center text-[var(--muted-foreground)]"><MapPin className="mx-auto mb-2 h-10 w-10 opacity-50" aria-hidden="true" /><p className="text-sm">{getApartmentLocation(apartment)}</p></div>
                  )}
                </div>
                {apartment.latitude && apartment.longitude && (
                  <a href={`https://www.google.com/maps?q=${apartment.latitude},${apartment.longitude}`} target="_blank" rel="noopener noreferrer" className="clay-btn-outline inline-flex items-center gap-2 text-sm mt-4">
                    احصل على الاتجاهات<ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar — Booking Card */}
          <div className="lg:col-span-1">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="sticky top-24">
              <div className="clay p-6">
                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-[var(--clay-accent)]">{apartment.price.toLocaleString("ar-SA")}</span>
                  <span className="text-lg font-medium text-[var(--muted-foreground)]">ر.س</span>
                  <span className="text-sm text-[var(--muted-foreground)]">/ ليلة</span>
                </div>

                <div className="flex items-center gap-2 mb-6 clay-inset px-4 py-3">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-[var(--foreground)]">{apartment.rating}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">· {apartment.reviewCount} تقييم</span>
                </div>

                {/* Booking Success */}
                {bookingSuccess ? (
                  <div className="clay-inset p-4 text-center mb-4">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                    <h3 className="font-bold text-lg text-[var(--foreground)] mb-2">تم الحجز بنجاح!</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-1">عدد الليالي: {bookingSuccess.totalNights}</p>
                    <p className="text-sm text-[var(--muted-foreground)] mb-1">المبلغ الإجمالي: {bookingSuccess.totalPrice.toLocaleString()} ر.س</p>
                    <p className="text-sm text-[var(--muted-foreground)]">رسوم المنصة: {bookingSuccess.platformFee.toLocaleString()} ر.س</p>
                    <Link to="/" className="clay-btn text-sm mt-4 inline-block">العودة للرئيسية</Link>
                  </div>
                ) : (
                  <>
                    {/* Date pickers */}
                    <div className="space-y-3 mb-4">
                      <label className="text-sm font-medium text-[var(--foreground)]"><Calendar className="w-4 h-4 inline ml-1.5" />تاريخ الوصول والمغادرة</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[var(--muted-foreground)] block mb-1"> الوصول</span>
                           <input type="date" className="clay-input w-full text-center text-sm" min={formatDateInput(new Date())} value={formatDateInput(checkIn)} onChange={(e) => setCheckIn(parseDateInput(e.target.value))} aria-label="تاريخ الوصول" />
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--muted-foreground)] block mb-1">المغادرة</span>
                           <input type="date" className="clay-input w-full text-center text-sm" min={checkIn ? formatDateInput(checkIn) : formatDateInput(new Date())} value={formatDateInput(checkOut)} onChange={(e) => setCheckOut(parseDateInput(e.target.value))} aria-label="تاريخ المغادرة" />
                        </div>
                      </div>
                      {liveUnavailable && liveUnavailable.unavailableDays.length > 0 && (
                        <details className="text-xs text-[var(--muted-foreground)]">
                          <summary className="cursor-pointer select-none">
                            <AlertCircle className="w-3.5 h-3.5 inline ml-1" />
                            أيام غير متاحة ({Math.min(liveUnavailable.unavailableDays.length, 90)} يوماً قادماً) — اضغط للعرض
                          </summary>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {liveUnavailable.unavailableDays.slice(0, 90).map((day) => (
                              <span key={day} className="bg-red-50 text-red-700 rounded-md px-1.5 py-0.5 text-[10px]">
                                {new Date(day).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                              </span>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Guests */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-[var(--foreground)] mb-2 block"><Users className="w-4 h-4 inline ml-1.5" />عدد الضيوف</label>
                      <div className="flex items-center gap-3 clay-inset px-4 py-2">
                         <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--clay-accent-soft)] font-bold text-[var(--clay-accent)]" aria-label="تقليل عدد الضيوف">-</button>
                        <span className="font-bold text-lg text-[var(--foreground)] min-w-[30px] text-center">{guests}</span>
                         <button type="button" onClick={() => setGuests(Math.min(apartment.maxGuests, guests + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--clay-accent-soft)] font-bold text-[var(--clay-accent)]" aria-label="زيادة عدد الضيوف">+</button>
                        <span className="text-xs text-[var(--muted-foreground)] mr-auto">حتى {apartment.maxGuests}</span>
                      </div>
                    </div>

                    {/* Availability indicator */}
                    {availability && (
                      <div className={`flex items-center gap-2 text-sm mb-2 px-3 py-2 rounded-xl ${availability.available && !nightsBelowMin ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {availability.available && !nightsBelowMin ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {!availability.available
                          ? "غير متاح في هذه التواريخ"
                          : nightsBelowMin
                            ? `الحد الأدنى للإقامة ${minNights} ليالٍ — اختر مدة أطول`
                            : "متاح في هذه التواريخ"}
                      </div>
                    )}

                    {/* Price breakdown */}
                    {totalNights > 0 && (
                      <div className="clay-inset p-4 mb-4 space-y-2">
                        {stayBreakdown && stayBreakdown.weekendNights > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-[var(--muted-foreground)]">سعر عادي × {stayBreakdown.weekdayNights} ليلة</span>
                              <span className="font-medium text-[var(--foreground)]">{(stayBreakdown.weekdayNights * apartment.price).toLocaleString()} ر.س</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-[var(--muted-foreground)]">نهاية الأسبوع (الخميس/الجمعة) × {stayBreakdown.weekendNights} ليلة</span>
                              <span className="font-medium text-[var(--foreground)]">
                                {(((apartment as { weekendPrice?: number }).weekendPrice ?? apartment.price) * stayBreakdown.weekendNights).toLocaleString()} ر.س
                              </span>
                            </div>
                          </>
                        )}
                        {stayBreakdown && stayBreakdown.weekendNights === 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">{apartment.price.toLocaleString()} ر.س × {totalNights} ليلة</span>
                            <span className="font-medium text-[var(--foreground)]">{totalPrice.toLocaleString()} ر.س</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--muted-foreground)]">رسوم الخدمة (10%)</span>
                          <span className="font-medium text-[var(--foreground)]">{platformFee.toLocaleString()} ر.س</span>
                        </div>
                        <hr className="border-[var(--border)]" />
                        <div className="flex justify-between font-bold">
                          <span>الإجمالي</span>
                          <span className="text-[var(--clay-accent)]">{(totalPrice + platformFee).toLocaleString()} ر.س</span>
                        </div>
                      </div>
                    )}

                    {bookingError && (
                      <p className="mb-3 flex items-center gap-1 text-sm text-red-500" role="alert" aria-live="assertive"><AlertCircle className="h-4 w-4" aria-hidden="true" />{bookingError}</p>
                    )}

                    {/* CTA */}
                    <button type="button" onClick={() => void handleBooking()} disabled={bookingLoading || !checkIn || !checkOut || totalNights < 1 || nightsBelowMin} className="clay-btn flex w-full items-center justify-center gap-2 py-3.5 text-center text-lg disabled:cursor-not-allowed disabled:opacity-50">
                      {bookingLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Calendar className="h-5 w-5" aria-hidden="true" />}
                      {bookingLoading ? "جاري الحجز..." : "احجز الآن"}
                    </button>

                    <p className="text-xs text-center text-[var(--muted-foreground)] mt-3">لن يتم خصم أي مبلغ حتى تأكيد الحجز</p>
                  </>
                )}

                {/* Quick info */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
                  {[
                    { icon: Bed, text: `${apartment.bedrooms} غرفة نوم` },
                    { icon: Bath, text: `${apartment.bathrooms} حمام` },
                    { icon: Users, text: `حتى ${apartment.maxGuests} ضيوف` },
                    { icon: Maximize, text: `${apartment.area} متر مربع` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <item.icon className="w-4 h-4" /><span>{item.text}</span>
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
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowLightbox(false)}>
          <button type="button" className="absolute right-6 top-6 z-10 text-white/70 hover:text-white" onClick={() => setShowLightbox(false)} aria-label="إغلاق معرض الصور"><X className="h-8 w-8" aria-hidden="true" /></button>
           <img src={apartment.images[selectedImage]} alt={getApartmentTitle(apartment)} className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {apartment.images.map((img, i) => (
              <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }} className={`h-10 w-12 overflow-hidden rounded-lg border-2 transition-all ${selectedImage === i ? "border-white scale-110" : "border-white/30 opacity-60"}`} aria-label={`عرض الصورة ${i + 1}`} aria-pressed={selectedImage === i}>
                <img src={img} alt={`${getApartmentTitle(apartment)} - صورة ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
