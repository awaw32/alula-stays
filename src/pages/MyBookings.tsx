import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";
import type { Id } from "@/convex/_generated/dataModel";
import { getApartmentLocation, getApartmentTitle, formatArabicDate } from "@/lib/apartment-content";
import { getErrorMessage } from "@/lib/error-message";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Loader2, AlertCircle, Search, FileText, Phone, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { InvoiceModal, type InvoiceData } from "@/components/InvoiceModal";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const } }),
};

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "مؤكد ومسدد", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "ملغى", color: "bg-red-100 text-red-700", icon: XCircle },
  completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
} as const;

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "past">("all");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [now] = useState(() => Date.now());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const liveBookings = useQuery(api.bookings.list, DEMO_MODE ? "skip" : {});
  const bookings = DEMO_MODE ? [] : liveBookings;
  const cancelBooking = useMutation(api.bookings.cancel);
  const cancelAndRefund = useAction(api.payments.cancelAndRefund);
  const verifyPayment = useAction(api.payments.verifyPayment);
  const createCheckoutSession = useAction(api.payments.createCheckoutSession);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  const sessionId = searchParams.get("tap_id") || searchParams.get("session_id");
  const bookingId = searchParams.get("booking");

  useEffect(() => {
    if (!sessionId || !bookingId) return;
    let active = true;
    if (DEMO_MODE) return;
    void verifyPayment({ bookingId: bookingId as Id<"bookings">, sessionId })
      .then((result) => {
        if (!active) return;
        toast[result.paid ? "success" : "warning"](result.paid ? "تم الدفع وتأكيد الحجز بنجاح" : "لم يكتمل الدفع");
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

  const handlePayNow = async (bId: Id<"bookings">) => {
    setPayingBookingId(bId);
    try {
      toast.loading("جارٍ فتح بوابة الدفع الآمنة...", { id: "pay-now" });
      const checkout = await createCheckoutSession({ bookingId: bId });
      if (checkout.url) {
        window.location.assign(checkout.url);
      } else {
        toast.dismiss("pay-now");
        toast.error("تعذر فتح بوابة الدفع حالياً. يرجى المحاولة لاحقاً");
      }
    } catch (err) {
      toast.dismiss("pay-now");
      toast.error(getErrorMessage(err, "فشل بدء عملية الدفع"));
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      const targetBooking = bookings?.find((b) => b._id === id);
      if (targetBooking?.paymentStatus === "paid") {
        toast.loading("جارٍ معالجة الإلغاء والاسترداد المالي...", { id: "cancel-booking" });
        const result = await cancelAndRefund({ bookingId: id as Id<"bookings"> });
        toast.dismiss("cancel-booking");
        toast.success(result.message);
      } else {
        const result = await cancelBooking({ bookingId: id as Id<"bookings"> });
        toast.success(result.message);
      }
    } catch (error) {
      toast.dismiss("cancel-booking");
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
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                          <span>رقم الفاتورة: <strong className="font-mono text-[var(--foreground)]">#{booking.invoiceNumber}</strong></span>
                          <span>•</span>
                          <span>المبلغ: <strong className="text-[var(--clay-accent)]">{(booking.totalPrice + booking.platformFee).toLocaleString()} ر.س</strong></span>
                          <span>•</span>
                          <span>{new Date(booking.checkIn).toLocaleDateString("ar-SA")} إلى {new Date(booking.checkOut).toLocaleDateString("ar-SA")}</span>
                        </div>

                        {/* أزرار الإجراءات والفاتورة */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedInvoice({
                                invoiceNumber: booking.invoiceNumber || `INV-${booking._id.slice(-6).toUpperCase()}`,
                                bookingId: booking._id,
                                status: booking.status,
                                paymentStatus: booking.paymentStatus,
                                apartmentTitle: title,
                                apartmentLocation: booking.apartment ? getApartmentLocation(booking.apartment) : "",
                                guestName: (booking as any).guest?.name || "ضيف العلا",
                                guestPhone: (booking as any).guest?.phone,
                                guestEmail: (booking as any).guest?.email,
                                ownerName: (booking as any).owner?.name,
                                ownerPhone: (booking as any).owner?.phone,
                                checkIn: booking.checkIn,
                                checkOut: booking.checkOut,
                                totalNights: booking.totalNights,
                                guests: booking.guests,
                                pricePerNight: booking.pricePerNight,
                                totalPrice: booking.totalPrice,
                                platformFee: booking.platformFee,
                                paymentSessionId: booking.paymentSessionId,
                                paidAt: (booking as any).paidAt,
                                createdAt: booking.createdAt,
                              })
                            }
                            className="clay-sm flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:bg-[var(--clay-accent-soft)]"
                          >
                            <FileText className="h-3.5 w-3.5 text-[var(--clay-accent)]" />
                            عرض الفاتورة
                          </button>

                          {booking.status === "pending" && booking.paymentStatus === "unpaid" && (
                            <button
                              type="button"
                              onClick={() => void handlePayNow(booking._id)}
                              disabled={payingBookingId === booking._id}
                              className="clay-btn flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold shadow-sm"
                            >
                              {payingBookingId === booking._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              ادفع الآن (مدى / Apple Pay)
                            </button>
                          )}

                          {booking.status !== "cancelled" && booking.status !== "completed" && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(booking._id)}
                              disabled={cancelling === booking._id}
                              className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              aria-label={`إلغاء حجز ${title}`}
                            >
                              {cancelling === booking._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                              ) : (
                                <XCircle className="h-3 w-3" aria-hidden="true" />
                              )}
                              إلغاء الحجز
                            </button>
                          )}
                        </div>

                        {/* كارت معلومات المالك والتواصل للضيف بعد تأكيد الحجز */}
                        {booking.status === "confirmed" && (
                          <div className="mt-3 rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="block font-bold text-emerald-900 dark:text-emerald-300">
                                  بيانات المستضيف والتواصل:
                                </span>
                                <span className="text-emerald-800 dark:text-emerald-400">
                                  {(booking as any).owner?.name || "مالك الشقة"}
                                  {(booking as any).owner?.phone ? ` · جوال: ${(booking as any).owner.phone}` : ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {(booking as any).owner?.phone && (
                                  <>
                                    <a
                                      href={`https://wa.me/${(booking as any).owner.phone.replace(/[^0-9]/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="clay-sm flex items-center gap-1 bg-white px-2.5 py-1 text-emerald-700 hover:bg-emerald-100 font-semibold"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                      واتساب
                                    </a>
                                    <a
                                      href={`tel:${(booking as any).owner.phone}`}
                                      className="clay-sm flex items-center gap-1 bg-white px-2.5 py-1 text-emerald-700 hover:bg-emerald-100 font-semibold"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                      اتصال
                                    </a>
                                  </>
                                )}
                                <Link
                                  to="/messages"
                                  className="clay-sm bg-white px-2.5 py-1 text-[var(--clay-accent)] hover:bg-[var(--clay-accent-soft)]"
                                >
                                  محادثة المنصة
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}

                        {booking.status === "confirmed" && booking.checkIn > now && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                            <AlertCircle className="h-3 w-3" aria-hidden="true" />
                            {(() => {
                              const hoursUntil = (booking.checkIn - now) / (1000 * 60 * 60);
                              if (hoursUntil > 72) return "سياسة الإلغاء: استرداد كامل (أكثر من 72 ساعة)";
                              if (hoursUntil > 24) return "سياسة الإلغاء: استرداد 50% (بين 24 و 72 ساعة)";
                              return "سياسة الإلغاء: لا يمكن الاسترداد (أقل من 24 ساعة)";
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <InvoiceModal
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="إلغاء الحجز؟"
        description="سيتم تطبيق سياسة الإلغاء بحسب الوقت المتبقي قبل الوصول."
        confirmLabel="إلغاء الحجز"
        destructive
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={async () => {
          if (cancelTarget) await handleCancel(cancelTarget);
        }}
      />
    </div>
  );
}
