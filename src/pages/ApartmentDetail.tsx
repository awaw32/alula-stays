import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation } from "convex/react";
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
  Loader2,
  AlertCircle,
  Clock,
  MessageSquare,
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
  const apartment = useQuery(api.apartments.get, id ? { apartmentId: id as any } : "skip");
  const reviews = useQuery(api.reviews.list, id ? { apartmentId: id as any } : "skip");
  const isFavorited = useQuery(api.favorites.isFavorited, id ? { apartmentId: id as any } : "skip");
  const toggleFavorite = useMutation(api.favorites.toggle);
  const createBooking = useMutation(api.bookings.create);
  const createReview = useMutation(api.reviews.create);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);

  const availability = useQuery(
    api.bookings.checkAvailability,
    id && checkIn && checkOut
      ? { apartmentId: id as any, checkIn: checkIn.getTime(), checkOut: checkOut.getTime() }
      : "skip",
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const totalNights =
    checkIn && checkOut
      ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const totalPrice = totalNights * (apartment?.price || 0);
  const platformFee = Math.round(totalPrice * 0.1);

  const handleBooking = async () => {
    if (!checkIn || !checkOut || !id) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const result = await createBooking({
        apartmentId: id as any,
        checkIn: checkIn.getTime(),
        checkOut: checkOut.getTime(),
        guests,
      });
      setBookingSuccess(result);
    } catch (err: any) {
      setBookingError(err.message || "حدث خطأ أثناء الحجز");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReview = async () => {
    if (!id || !reviewComment.trim()) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      await createReview({
        apartmentId: id as any,
        rating: reviewRating,
        comment: reviewComment,
      });
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
    } catch (err: any) {
      setReviewError(err.message || "حدث خطأ أثناء إرسال التقييم");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!id) return;
    try {
      await toggleFavorite({ apartmentId: id as any });
    } catch {
      navigate("/auth");
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });

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
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
            <Link to="/" className="hover:text-[var(--clay-accent)] transition-colors">الرئيسية</Link>
            <span>/</span>
            <Link to="/apartments" className="hover:text-[var(--clay-accent)] transition-colors">الشقق</Link>
            <span>/</span>
            <span className="text-[var(--foreground)] font-medium truncate max-w-[200px]">{apartment.title}</span>
          </div>
        </motion.div>

        {/* Image Gallery */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <div className="clay overflow-hidden mb-8">
            <div
              className="relative aspect-[16/9] md:aspect-[21/9] bg-[var(--clay-surface)] cursor-pointer overflow-hidden rounded-t-[1.5rem]"
              onClick={() => setShowLightbox(true)}
            >
              <img src={apartment.images[selectedImage]} alt={apartment.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
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
                onClick={(e) => { e.stopPropagation(); handleFavorite(); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
              </button>
            </div>
            <div className="flex gap-2 p-3 overflow-x-auto">
              {apartment.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-[var(--clay-accent)] shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
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
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">{apartment.title}</h1>
                    <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                      <MapPin className="w-4 h-4" /><span>{apartment.location}</span>
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
                <p className="text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">{apartment.description}</p>
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
                        <span className="text-sm font-medium text-[var(--foreground)]">{config?.label || amenity.replace(/_/g, " ")}</span>
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
                  <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">قواعد الإقامة</h2>
                  <ul className="space-y-2">
                    {apartment.rules.map((rule, i) => (
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
                  <button onClick={() => setShowReviewForm(!showReviewForm)} className="clay-btn text-sm py-2 px-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />أضف تقييم
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div className="clay-inset p-4 mb-4">
                    <div className="mb-3">
                      <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">تقييمك</label>
                      <StarRating rating={reviewRating} size="w-6 h-6" />
                      <input type="range" min={1} max={5} value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="w-full mt-2 accent-[var(--clay-accent)]" />
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="اكتب تجربتك..." className="clay-input w-full min-h-[100px] text-sm resize-none" />
                    {reviewError && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{reviewError}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleReview} disabled={reviewLoading || !reviewComment.trim()} className="clay-btn text-sm py-2 px-6 flex items-center gap-2">
                        {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        إرسال
                      </button>
                      <button onClick={() => setShowReviewForm(false)} className="clay-btn-outline text-sm py-2 px-4">إلغاء</button>
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
                              <span className="text-xs text-[var(--muted-foreground)] block">{formatDate(review.createdAt)}</span>
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
                <div className="clay-inset aspect-[16/9] rounded-2xl flex items-center justify-center overflow-hidden">
                  {apartment.latitude && apartment.longitude ? (
                    <iframe title="Apartment Location" className="w-full h-full border-0 rounded-2xl" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${apartment.longitude - 0.02}%2C${apartment.latitude - 0.02}%2C${apartment.longitude + 0.02}%2C${apartment.latitude + 0.02}&layer=mapnik&marker=${apartment.latitude}%2C${apartment.longitude}`} />
                  ) : (
                    <div className="text-center text-[var(--muted-foreground)]"><MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">{apartment.location}</p></div>
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
                  <span className="text-3xl font-extrabold text-[var(--clay-accent)]">{apartment.price.toLocaleString()}</span>
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
                          <input type="date" className="clay-input text-sm text-center w-full" min={new Date().toISOString().split("T")[0]} onChange={(e) => setCheckIn(e.target.value ? new Date(e.target.value) : null)} />
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--muted-foreground)] block mb-1">المغادرة</span>
                          <input type="date" className="clay-input text-sm text-center w-full" min={checkIn ? checkIn.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} onChange={(e) => setCheckOut(e.target.value ? new Date(e.target.value) : null)} />
                        </div>
                      </div>
                    </div>

                    {/* Guests */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-[var(--foreground)] mb-2 block"><Users className="w-4 h-4 inline ml-1.5" />عدد الضيوف</label>
                      <div className="flex items-center gap-3 clay-inset px-4 py-2">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full bg-[var(--clay-accent-soft)] text-[var(--clay-accent)] font-bold flex items-center justify-center">-</button>
                        <span className="font-bold text-lg text-[var(--foreground)] min-w-[30px] text-center">{guests}</span>
                        <button onClick={() => setGuests(Math.min(apartment.maxGuests, guests + 1))} className="w-8 h-8 rounded-full bg-[var(--clay-accent-soft)] text-[var(--clay-accent)] font-bold flex items-center justify-center">+</button>
                        <span className="text-xs text-[var(--muted-foreground)] mr-auto">حتى {apartment.maxGuests}</span>
                      </div>
                    </div>

                    {/* Availability indicator */}
                    {availability && (
                      <div className={`flex items-center gap-2 text-sm mb-4 px-3 py-2 rounded-xl ${availability.available ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {availability.available ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {availability.available ? "متاح في هذه التواريخ" : "غير متاح في هذه التواريخ"}
                      </div>
                    )}

                    {/* Price breakdown */}
                    {totalNights > 0 && (
                      <div className="clay-inset p-4 mb-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--muted-foreground)]">{apartment.price.toLocaleString()} ر.س × {totalNights} ليلة</span>
                          <span className="font-medium text-[var(--foreground)]">{totalPrice.toLocaleString()} ر.س</span>
                        </div>
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
                      <p className="text-red-500 text-sm mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{bookingError}</p>
                    )}

                    {/* CTA */}
                    <button onClick={handleBooking} disabled={bookingLoading || !checkIn || !checkOut || totalNights < 1} className="clay-btn w-full text-center text-lg py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
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
          <button className="absolute top-6 right-6 text-white/70 hover:text-white z-10" onClick={() => setShowLightbox(false)}><X className="w-8 h-8" /></button>
          <img src={apartment.images[selectedImage]} alt={apartment.title} className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {apartment.images.map((img, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }} className={`w-12 h-10 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i ? "border-white scale-110" : "border-white/30 opacity-60"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
