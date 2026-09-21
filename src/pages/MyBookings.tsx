import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link } from "react-router";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const },
  }),
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "مؤكد", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "ملغى", color: "bg-red-100 text-red-700", icon: XCircle },
  completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
};

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "past">("all");
  const bookings = useQuery(api.bookings.list, {});
  const cancelBooking = useMutation(api.bookings.cancel);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const now = Date.now();
  const filteredBookings = bookings?.filter((b) => {
    if (activeTab === "active") return b.status === "confirmed" && b.checkOut > now;
    if (activeTab === "past") return b.status === "completed" || b.checkOut < now || b.status === "cancelled";
    return true;
  });

  const handleCancel = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;
    setCancelling(id);
    try {
      await cancelBooking({ bookingId: id as any });
    } catch {
      alert("حدث خطأ أثناء الإلغاء");
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("ar-SA", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">حجوزاتي</h1>
          <p className="text-[var(--muted-foreground)]">تتبع حجوزاتك النشطة والسابقة</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 mb-8">
          {([
            { key: "all" as const, label: "الكل" },
            { key: "active" as const, label: "النشطة" },
            { key: "past" as const, label: "السابقة" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`clay-sm px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings === undefined ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="clay animate-pulse p-6 h-32" />
            ))}
          </div>
        ) : filteredBookings?.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <div className="clay p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
              <h3 className="font-bold text-lg text-[var(--foreground)] mb-2">
                {activeTab === "all" ? "لا توجد حجوزات بعد" : "لا توجد نتائج"}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                {activeTab === "all" ? "ابدأ بحجز شقة في العلا!" : "جرب تبويباً آخر"}
              </p>
              <Link to="/apartments" className="clay-btn text-sm inline-flex items-center gap-2">
                <Search className="w-4 h-4" />تصفح الشقق
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredBookings?.map((booking, i) => {
              const status = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <motion.div key={booking._id} variants={fadeUp} custom={i + 1}>
                  <div className="clay p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                      {booking.apartment?.images?.[0] && (
                        <Link to={`/apartment/${booking.apartmentId}`} className="shrink-0">
                          <img src={booking.apartment.images[0]} alt="" className="w-full md:w-32 h-24 object-cover rounded-xl" />
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <Link to={`/apartment/${booking.apartmentId}`} className="font-bold text-[var(--foreground)] hover:text-[var(--clay-accent)] transition-colors">
                              {booking.apartment?.title || "شقة"}
                            </Link>
                            <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                              <MapPin className="w-3.5 h-3.5" />{booking.apartment?.location || ""}
                            </div>
                          </div>
                          <span className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />{status.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)] mt-3">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</span>
                          <span>{booking.totalNights} ليلة</span>
                          <span>{booking.guests} ضيوف</span>
                          <span className="font-bold text-[var(--clay-accent)]">{booking.totalPrice.toLocaleString()} ر.س</span>
                        </div>
                        {booking.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleCancel(booking._id)} disabled={cancelling === booking._id} className="clay-sm px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1">
                              {cancelling === booking._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}إلغاء الحجز
                            </button>
                          </div>
                        )}
                        {booking.status === "confirmed" && booking.checkIn > now && (
                          <div className="mt-3 clay-inset inline-flex items-center gap-2 px-4 py-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-[var(--muted-foreground)]">اصطحب هذا الحجز عند الوصول • رقم: {booking._id.slice(-8).toUpperCase()}</span>
                          </div>
                        )}
                        {booking.status === "confirmed" && booking.checkIn > now && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                            <AlertCircle className="w-3 h-3" />
                            {(() => {
                              const hoursUntil = (booking.checkIn - now) / (1000 * 60 * 60);
                              if (hoursUntil > 72) return "يمكنك الإلغاء باسترداد كامل";
                              if (hoursUntil > 24) return "يمكنك الإلغاء باسترداد 50%";
                              return "لا يمكن الاسترداد (أقل من 24 ساعة)";
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
