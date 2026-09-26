import { motion } from "framer-motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation } from "convex/react";
import { DEMO_MODE } from "@/lib/demo-data";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Navigate } from "react-router";
import {
  Home,
  Calendar,
  DollarSign,
  Star,
  Edit,
  Trash2,
  Eye,
  Loader2,
  FileText,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { CalendarBlockManager } from "@/components/owner/CalendarBlockManager";
import { OwnerFinance } from "@/components/owner/OwnerFinance";
import { OwnerIdentityVerification } from "@/components/owner/OwnerIdentityVerification";
import { InvoiceModal, type InvoiceData } from "@/components/InvoiceModal";
import { OwnerApplicationForm } from "@/components/owner/OwnerApplicationForm";
import { OwnerPendingView } from "@/components/owner/OwnerPendingView";
import { AlertCircle, RefreshCw } from "lucide-react";

const OWNER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "بانتظار مراجعة الإدارة", className: "bg-amber-100 text-amber-700" },
  approved: { label: "منشورة", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "مرفوضة", className: "bg-red-100 text-red-700" },
  needs_changes: { label: "تحتاج تعديلات", className: "bg-blue-100 text-blue-700" },
  suspended: { label: "موقوفة مؤقتاً", className: "bg-gray-100 text-gray-600" },
};

function getOwnerStatusInfo(apt: { status?: string; isVerified?: boolean }) {
  if (apt.status) return OWNER_STATUS_LABELS[apt.status];
  // توافق مع الشقق القديمة قبل إضافة status
  return apt.isVerified ? OWNER_STATUS_LABELS.approved : OWNER_STATUS_LABELS.pending;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ownerStatus = useQuery(api.owners.myOwnerStatus, DEMO_MODE ? "skip" : undefined);
  const myProfile = useQuery(api.users.myProfile, DEMO_MODE ? "skip" : undefined);
  const myApartments = useQuery(
    api.admin.ownerApartments,
    DEMO_MODE || ownerStatus?.status !== "approved" ? "skip" : undefined
  );
  const myBookings = useQuery(
    api.bookings.ownerBookings,
    DEMO_MODE || ownerStatus?.status !== "approved" ? "skip" : undefined
  );
  const deleteApartment = useMutation(api.admin.deleteApartment);
  const [activeTab, setActiveTab] = useState<"apartments" | "bookings" | "calendar" | "finance">("apartments");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [now] = useState(() => Date.now());
  const [retryRejected, setRetryRejected] = useState(false);

  // حالة انتظار تحميل حالة المالك
  if (ownerStatus === undefined) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--clay-accent)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">جارٍ التحقق من بيانات المالك...</p>
        </div>
      </div>
    );
  }

  // 1. إذا كان الطلب قيد المراجعة: عرض صفحة "تم رفع بياناتك للإدارة وسيتم قبول حسابك بأقرب وقت"
  if (ownerStatus.status === "pending" && ownerStatus.application) {
    return (
      <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
        <Navigation />
        <OwnerPendingView application={ownerStatus.application} />
      </div>
    );
  }

  // 2. إذا لم يكن المالك قد قدّم طلباً بعد: عرض استمارة الانضمام كمالك عقار
  if (ownerStatus.status === "none") {
    return (
      <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
        <Navigation />
        <OwnerApplicationForm
          initialName={user?.name || ""}
          initialPhone={myProfile?.phone || ""}
        />
      </div>
    );
  }

  // 3. إذا كان الطلب مرفوضاً: عرض سبب الرفض وإتاحة إعادة التقديم
  if (ownerStatus.status === "rejected") {
    if (retryRejected) {
      return (
        <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
          <Navigation />
          <OwnerApplicationForm
            initialName={ownerStatus.application?.fullName || user?.name || ""}
            initialPhone={ownerStatus.application?.phone || myProfile?.phone || ""}
            onSuccess={() => setRetryRejected(false)}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
        <Navigation />
        <div className="max-w-2xl mx-auto py-16 px-4 text-center" dir="rtl">
          <div className="clay p-8 border border-red-500/20">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">ملاحظة بخصوص طلب الانضمام كمالك عقار</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              نعتذر، لم يتم اعتماد الطلب في الوقت الحالي نظراً للملاحظات التالية:
            </p>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3.5 text-xs text-red-700 dark:text-red-300 font-medium mb-6">
              {ownerStatus.application?.rejectionReason || "البيانات المقدمة غير كافية أو بحاجة لتوثيق إضافي."}
            </div>
            <button
              type="button"
              onClick={() => setRetryRejected(true)}
              className="clay-btn px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث البيانات وإعادة التقديم</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteApartment({ apartmentId: id as Id<"apartments"> });
      toast.success("تم حذف الشقة بنجاح");
    } catch (error) {
      toast.error(getErrorMessage(error, "حدث خطأ أثناء حذف الشقة"));
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  const totalEarnings = myBookings
    ?.filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.totalPrice - b.platformFee), 0) || 0;

  const activeBookings = myBookings?.filter((b) => b.status === "confirmed" && b.checkOut > now) || [];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
            لوحة تحكم المالك
          </h1>
          <p className="text-[var(--muted-foreground)]">
            مرحباً {user?.name || "المالك"}
            {myProfile?.phone ? ` · جوال: ${myProfile.phone}` : ""}
          </p>
        </motion.div>

        {/* Identity Verification */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
          <OwnerIdentityVerification />
        </motion.div>

        {/* Stats */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-8">
          {[
            { icon: Home, label: "شققي", value: myApartments?.length || 0, color: "bg-blue-50 text-blue-600" },
            { icon: Calendar, label: "الحجوزات النشطة", value: activeBookings.length, color: "bg-emerald-50 text-emerald-600" },
            { icon: DollarSign, label: "الأرباح", value: `${totalEarnings.toLocaleString()} ر.س`, color: "bg-amber-50 text-amber-600" },
            { icon: Star, label: "متوسط التقييم", value: myApartments?.length ? (myApartments.reduce((s, a) => s + a.rating, 0) / myApartments.length).toFixed(1) : "0", color: "bg-purple-50 text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="clay p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-[var(--foreground)]">{stat.value}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["apartments", "bookings", "calendar", "finance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`clay-sm px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"
              }`}
            >
              {tab === "apartments" ? "شققي" : tab === "bookings" ? "الحجوزات" : tab === "calendar" ? "تقويم التوفر" : "المالية"}
            </button>
          ))}
        </div>

        {/* Apartments Tab */}
        {activeTab === "apartments" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">شققي ({myApartments?.length ?? 0})</h2>
              <button onClick={() => navigate("/owner/add")} className="clay-btn text-sm">إضافة شقة</button>
            </div>
            {myApartments === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : myApartments.length === 0 ? (
              <div className="clay p-12 text-center">
                <Home className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                <h3 className="font-bold text-lg mb-2">لا توجد شقق بعد</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">أضف شقتك الأولى للبدء</p>
                <button onClick={() => navigate("/owner/add")} className="clay-btn text-sm">إضافة شقة</button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApartments.map((apt) => (
                  <div key={apt._id} className="clay p-4 flex flex-col md:flex-row gap-4">
                    <img src={apt.images[0]} alt={apt.title} className="w-full md:w-32 h-24 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-[var(--foreground)] truncate">{apt.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getOwnerStatusInfo(apt).className}`}>
                          {getOwnerStatusInfo(apt).label}
                        </span>
                        {apt.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      {apt.reviewNotes && apt.status !== "approved" && (
                        <p className="text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 mb-2">
                          📝 ملاحظات الإدارة: {apt.reviewNotes}
                        </p>
                      )}
                      <p className="text-sm text-[var(--muted-foreground)] mb-2">{apt.location}</p>
                      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                        <span className="font-bold text-[var(--clay-accent)]">{apt.price.toLocaleString()} ر.س/ليلة</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{apt.rating}</span>
                        <span>{apt.bedrooms} غرف</span>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <button type="button" onClick={() => navigate(`/apartment/${apt._id}`)} className="clay-sm p-2 transition-colors hover:bg-[var(--clay-accent-soft)]" aria-label={`عرض ${apt.title}`} title="عرض الشقة"><Eye className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" /></button>
                      <button type="button" onClick={() => navigate(`/owner/edit/${apt._id}`)} className="clay-sm p-2 transition-colors hover:bg-[var(--clay-accent-soft)]" aria-label={`تعديل ${apt.title}`} title="تعديل الشقة"><Edit className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" /></button>
                      <button type="button" onClick={() => setDeleteTarget(apt._id)} disabled={deleting === apt._id} className="clay-sm p-2 transition-colors hover:bg-red-50" aria-label={`حذف ${apt.title}`} title="حذف الشقة">
                        {deleting === apt._id ? <Loader2 className="h-4 w-4 animate-spin text-red-500" aria-hidden="true" /> : <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {myBookings === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : myBookings.length === 0 ? (
              <div className="clay p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                <h3 className="font-bold text-lg mb-2">لا توجد حجوزات بعد</h3>
                <p className="text-sm text-[var(--muted-foreground)]">ستظهر الحجوزات هنا عندما يحجز ضيوف شققك</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking) => {
                  const guestInfo = (booking as any).guest;
                  const invoiceNum = booking.invoiceNumber || `INV-${booking._id.slice(-6).toUpperCase()}`;
                  const isPaid = booking.paymentStatus === "paid" || booking.status === "confirmed";

                  return (
                    <div key={booking._id} className="clay p-4 flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[var(--foreground)]">{booking.apartment?.title || "شقة"}</h3>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[var(--muted-foreground)]">
                              #{invoiceNum}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(booking.checkIn).toLocaleDateString("ar-SA")} — {new Date(booking.checkOut).toLocaleDateString("ar-SA")}</span>
                            <span>{booking.totalNights} ليلة</span>
                            <span>{booking.guests} ضيوف</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs">
                            <span className="text-[var(--muted-foreground)]">إجمالي الحجز: <span className="font-medium">{booking.totalPrice.toLocaleString()} ر.س</span></span>
                            <span className="text-[var(--muted-foreground)]">عمولة المنصة: <span className="font-medium text-red-600">−{booking.platformFee.toLocaleString()} ر.س</span></span>
                            <span className="text-emerald-700 font-semibold">صافي مستحقك: {(booking.totalPrice - booking.platformFee).toLocaleString()} ر.س</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                            booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {booking.status === "confirmed" ? "مؤكد ومسدد" :
                             booking.status === "pending" ? "قيد الانتظار" :
                             booking.status === "cancelled" ? "ملغى" : "مكتمل"}
                          </span>
                        </div>
                      </div>

                      {/* شريط بيانات الضيف والتواصل والفاتورة */}
                      <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--foreground)]">الضيف:</span>
                          <span className="font-semibold text-[var(--foreground)]">{guestInfo?.name || "ضيف العلا"}</span>
                          {guestInfo?.phone && (
                            <span className="text-[var(--muted-foreground)] dir-ltr font-mono">
                              ({guestInfo.phone})
                            </span>
                          )}
                          {guestInfo?.email && (
                            <span className="text-[var(--muted-foreground)] hidden sm:inline">
                              · {guestInfo.email}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {guestInfo?.phone && isPaid && (
                            <>
                              <a
                                href={`https://wa.me/${guestInfo.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="clay-sm px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 font-semibold"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                واتساب الضيف
                              </a>
                              <a
                                href={`tel:${guestInfo.phone}`}
                                className="clay-sm px-2.5 py-1 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 flex items-center gap-1 font-semibold"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                اتصال
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedInvoice({
                                invoiceNumber: invoiceNum,
                                bookingId: booking._id,
                                status: booking.status,
                                paymentStatus: booking.paymentStatus,
                                apartmentTitle: booking.apartment?.title || "شقة",
                                apartmentLocation: booking.apartment?.location || "العلا",
                                guestName: guestInfo?.name || "ضيف العلا",
                                guestPhone: guestInfo?.phone,
                                guestEmail: guestInfo?.email,
                                ownerName: user?.name || "المالك",
                                ownerPhone: myProfile?.phone,
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
                            className="clay-sm px-2.5 py-1 text-xs font-medium flex items-center gap-1 hover:bg-[var(--clay-accent-soft)]"
                          >
                            <FileText className="w-3.5 h-3.5 text-[var(--clay-accent)]" />
                            عرض الفاتورة
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <CalendarBlockManager
              apartments={myApartments ?? []}
            />
          </motion.div>
        )}

        {/* Finance Tab */}
        {activeTab === "finance" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <OwnerFinance />
          </motion.div>
        )}
      </div>
      <InvoiceModal
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الشقة؟"
        description="سيتم حذف الشقة نهائياً ولا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف الشقة"
        destructive
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
