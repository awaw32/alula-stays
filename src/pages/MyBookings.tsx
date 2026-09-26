import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";
import type { Id } from "@/convex/_generated/dataModel";
import { getApartmentLocation, getApartmentTitle, formatArabicDate } from "@/lib/apartment-content";
import { getErrorMessage } from "@/lib/error-message";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Loader2, AlertCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const } }),
};

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "مؤكد", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "ملغى", color: "bg-red-100 text-red-700", icon: XCircle },
  completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
} as const;

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "past">("all");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const liveBookings = useQuery(api.bookings.list, DEMO_MODE ? "skip" : {});
  const bookings = DEMO_MODE ? [] : liveBookings;
  const cancelBooking = useMutation(api.bookings.cancel);
  const verifyPayment = useAction(api.payments.verifyPayment);

  const sessionId = searchParams.get("tap_id") || searchParams.get("session_id");
  const bookingId = searchParams.get("booking");

  useEffect(() => {
    if (!sessionId || !bookingId) return;
    let active = true;
    if (DEMO_MODE) return;
    void verifyPayment({ bookingId: bookingId as Id<"bookings">, sessionId })
      .then((result) => {
        if (!active) return;
        toast[result.paid ? "success" : "warning"](result.paid ? "تم الدفع وتأكيد الحجز" : "لم يكتمل الدفع");
        navigate("/my-bookings", { replace: true });
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error, "تعذر التحقق من الدفع"));
      });
    return () => {
      active = false;
    };
  }, [bookingId, navigate, sessionId, verifyPayment]);

  const filteredBookings = bookings?.filter((booking) => {
    if (activeTab === "active") return booking.status === "confirmed" && booking.checkOut > now;
    if (activeTab === "past") return booking.status === "completed" || booking.checkOut < now || booking.status === "cancelled";
    return true;
  });

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      const result = await cancelBooking({ bookingId: id as Id<"bookings"> });
      toast.success(result.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "حدث خطأ أثناء إلغاء الحجز"));
    } finally {
      setCancelling(null);
      setCancelTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)] md:text-3xl">حجوزاتي</h1>
          <p className="text-[var(--muted-foreground)]">تتبع حجوزاتك النشطة والسابقة</p>
        </motion.div>

        <div className="mb-8 mt-6 flex gap-2" role="tablist" aria-label="تصفية الحجوزات">
          {([
            ["all", "الكل"],
            ["active", "النشطة"],
            ["past", "السابقة"],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={activeTab === key} onClick={() => setActiveTab(key)} className={`clay-sm px-5 py-2.5 text-sm font-medium transition-all ${activeTab === key ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"}`}>
              {label}
            </button>
          ))}
        </div>

        {bookings === undefined ? (
          <div className="space-y-4"><div className="clay h-32 animate-pulse p-6" /><div className="clay h-32 animate-pulse p-6" /></div>
        ) : filteredBookings?.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <div className="clay p-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" aria-hidden="true" />
              <h2 className="mb-2 text-lg font-bold text-[var(--foreground)]">{activeTab === "all" ? "لا توجد حجوزات بعد" : "لا توجد نتائج"}</h2>
              <p className="mb-6 text-sm text-[var(--muted-foreground)]">{activeTab === "all" ? "ابدأ بحجز شقة في العلا!" : "جرب تبويباً آخر"}</p>
              <Link to="/apartments" className="clay-btn inline-flex items-center gap-2 text-sm"><Search className="h-4 w-4" aria-hidden="true" />تصفح الشقق</Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredBookings?.map((booking, index) => {
              const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = status.icon;
              const title = booking.apartment ? getApartmentTitle(booking.apartment) : "شقة";
              return (
                <motion.div key={booking._id} variants={fadeUp} custom={index + 1}>
                  <article className="clay p-5">
                    <div className="flex flex-col gap-4 md:flex-row">
                      {booking.apartment?.images?.[0] && <Link to={`/apartment/${booking.apartmentId}`} className="shrink-0"><img src={booking.apartment.images[0]} alt={title} className="h-24 w-full rounded-xl object-cover md:w-32" /></Link>}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <Link to={`/apartment/${booking.apartmentId}`} className="font-bold text-[var(--foreground)] transition-colors hover:text-[var(--clay-accent)]">{title}</Link>
                            <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{booking.apartment ? getApartmentLocation(booking.apartment) : ""}</div>
                          </div>
                          <span className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}><StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />{status.label}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />{formatArabicDate(booking.checkIn)} — {formatArabicDate(booking.checkOut)}</span><span>{booking.totalNights} ليلة</span><span>{booking.guests} ضيوف</span><span className="font-bold text-[var(--clay-accent)]">{booking.totalPrice.toLocaleString("ar-SA")} ر.س</span></div>
                        {booking.status === "pending" && <div className="mt-3"><button type="button" onClick={() => setCancelTarget(booking._id)} disabled={cancelling === booking._id} className="clay-sm flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50" aria-label={`إلغاء حجز ${title}`}>{cancelling === booking._id ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <XCircle className="h-3 w-3" aria-hidden="true" />}إلغاء الحجز</button></div>}
                        {booking.status === "confirmed" && booking.checkIn > now && <div className="clay-inset mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" /><span className="text-[var(--muted-foreground)]">رقم الحجز: {booking._id.slice(-8).toUpperCase()}</span></div>}
                        {booking.status === "confirmed" && booking.checkIn > now && <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><AlertCircle className="h-3 w-3" aria-hidden="true" />{(() => { const hoursUntil = (booking.checkIn - now) / (1000 * 60 * 60); if (hoursUntil > 72) return "يمكنك الإلغاء باسترداد كامل"; if (hoursUntil > 24) return "يمكنك الإلغاء باسترداد 50%"; return "لا يمكن الاسترداد (أقل من 24 ساعة)"; })()}</div>}
                      </div>
                    </div>
                  </article>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <ConfirmDialog open={Boolean(cancelTarget)} title="إلغاء الحجز؟" description="سيتم تطبيق سياسة الإلغاء بحسب الوقت المتبقي قبل الوصول." confirmLabel="إلغاء الحجز" destructive onOpenChange={(open) => { if (!open) setCancelTarget(null); }} onConfirm={async () => { if (cancelTarget) await handleCancel(cancelTarget); }} />
    </div>
  );
}
