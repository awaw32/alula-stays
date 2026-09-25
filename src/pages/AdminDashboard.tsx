import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation } from "convex/react";
import { DEMO_MODE } from "@/lib/demo-data";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/auth";
import { getApartmentLocation, getApartmentTitle } from "@/lib/apartment-content";
import { getErrorMessage } from "@/lib/error-message";
import { toast } from "sonner";
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Shield,
  TrendingUp,
  Eye,
  AlertCircle,
} from "lucide-react";
// CheckCircle/XCircle مستخدمان في أزرار الشقق أدناه
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "بانتظار المراجعة", className: "bg-amber-100 text-amber-700" },
  approved: { label: "منشورة", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "مرفوضة", className: "bg-red-100 text-red-700" },
  needs_changes: { label: "تحتاج تعديلات", className: "bg-blue-100 text-blue-700" },
  suspended: { label: "موقوفة مؤقتاً", className: "bg-gray-100 text-gray-600" },
};

function getStatusInfo(apt: { status?: string; isVerified?: boolean }) {
  if (apt.status) return STATUS_LABELS[apt.status];
  // توافق مع الشقق القديمة قبل إضافة status
  return apt.isVerified ? STATUS_LABELS.approved : STATUS_LABELS.pending;
}

type ReviewAction = "reject" | "needs_changes" | "suspend" | null;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const stats = useQuery(api.admin.adminDashboardStats, DEMO_MODE ? "skip" : undefined);
  const allApartments = useQuery(api.admin.allApartments, DEMO_MODE ? "skip" : undefined);
  const allUsers = useQuery(api.admin.allUsers, DEMO_MODE ? "skip" : undefined);
  const setStatus = useMutation(api.admin.adminSetApartmentStatus);
  const featureApartment = useMutation(api.admin.adminFeatureApartment);
  const updateRole = useMutation(api.admin.adminUpdateUserRole);
  const setUserDisabled = useMutation(api.admin.adminSetUserDisabled);

  const handleToggleDisable = async (id: string, disabled: boolean, name: string) => {
    try {
      await setUserDisabled({
        userId: id as Id<"users">,
        disabled,
        reason: disabled ? "تعطيل من لوحة الإدارة" : undefined,
      });
      toast.success(disabled ? `تم تعطيل حساب ${name}` : `تم تفعيل حساب ${name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث حالة الحساب"));
    }
  };
  const [activeTab, setActiveTab] = useState<"stats" | "apartments" | "users" | "bookings" | "finance" | "activity">("stats");
  const adminBookings = useQuery(api.bookings.adminList, DEMO_MODE || activeTab !== "bookings" ? "skip" : {});
  const activityLog = useQuery(api.admin.adminActivityLog, DEMO_MODE || activeTab !== "activity" ? "skip" : { limit: 80 });
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string; action: Exclude<ReviewAction, null> } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openReviewDialog = (id: string, title: string, action: Exclude<ReviewAction, null>) => {
    setReviewTarget({ id, title, action });
    setReason("");
  };

  const confirmReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      const result = await setStatus({
        apartmentId: reviewTarget.id as Id<"apartments">,
        status: reviewTarget.action === "reject" ? "rejected" : reviewTarget.action === "needs_changes" ? "needs_changes" : "suspended",
        reason: reason.trim() || undefined,
      });
      toast.success(result);
      setReviewTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث حالة الشقة"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const result = await setStatus({ apartmentId: id as Id<"apartments">, status: "approved" });
      toast.success(result);
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر قبول الشقة"));
    }
  };

  const handleFeature = async (id: string, featured: boolean) => {
    try {
      await featureApartment({ apartmentId: id as Id<"apartments">, featured });
      toast.success(featured ? "تم تمييز الشقة" : "تم إلغاء تمييز الشقة");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث الشقة"));
    }
  };

  const handleRoleChange = async (id: string, role: UserRole) => {
    try {
      await updateRole({ userId: id as Id<"users">, role });
      toast.success("تم تحديث دور المستخدم");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث دور المستخدم"));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">لوحة التحكم الإدارية</h1>
              <p className="text-sm text-[var(--muted-foreground)]">مرحباً {user?.name || "المدير"}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-8">
            {[
              { icon: Users, label: "المستخدمون", value: stats.totalUsers, color: "bg-blue-50 text-blue-600" },
              { icon: Home, label: "الشقق", value: stats.totalApartments, color: "bg-emerald-50 text-emerald-600" },
              { icon: Calendar, label: "الحجوزات", value: stats.totalBookings, color: "bg-purple-50 text-purple-600" },
              { icon: DollarSign, label: "إيرادات المنصة", value: `${stats.platformRevenue.toLocaleString()} ر.س`, color: "bg-amber-50 text-amber-600" },
              { icon: TrendingUp, label: "الحجوزات الشهر", value: stats.monthlyBookings, color: "bg-pink-50 text-pink-600" },
              { icon: Star, label: "متوسط التقييم", value: stats.avgRating, color: "bg-yellow-50 text-yellow-600" },
              { icon: AlertCircle, label: "بانتظار التوثيق", value: stats.pendingVerification, color: "bg-orange-50 text-orange-600" },
              { icon: Eye, label: "التقييمات", value: stats.totalReviews, color: "bg-teal-50 text-teal-600" },
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
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2" role="tablist" aria-label="أقسام لوحة الإدارة">
          {(["stats", "apartments", "bookings", "users", "finance", "activity"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`clay-sm px-5 py-2.5 text-sm font-medium transition-all ${activeTab === tab ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"}`}
            >
              {tab === "stats" ? "نظرة عامة" : tab === "apartments" ? "الشقق" : tab === "bookings" ? "الحجوزات" : tab === "users" ? "المستخدمون" : tab === "finance" ? "المالية" : "سجل النشاط"}
            </button>
          ))}
        </div>

        {/* Apartments Management */}
        {activeTab === "apartments" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {allApartments === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : (
              <div className="space-y-3">
                {allApartments.map((apt) => (
                  <div key={apt._id} className="clay p-4 flex flex-col md:flex-row gap-4 items-start">
                      <img src={apt.images[0]} alt={getApartmentTitle(apt)} className="w-full md:w-24 h-20 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[var(--foreground)] truncate">{getApartmentTitle(apt)}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusInfo(apt).className}`}>
                          {getStatusInfo(apt).label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">{getApartmentLocation(apt)} · {apt.price.toLocaleString("ar-SA")} ر.س/ليلة</p>
                      {apt.reviewNotes && apt.status !== "approved" && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate" title={apt.reviewNotes}>
                          📝 ملاحظات سابقة: {apt.reviewNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {getStatusInfo(apt) !== STATUS_LABELS.approved && (
                        <button type="button" onClick={() => handleApprove(apt._id)} className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700" aria-label="قبول الشقة ونشرها">
                          <CheckCircle className="w-3.5 h-3.5" />
                          قبول
                        </button>
                      )}
                      <button type="button" onClick={() => openReviewDialog(apt._id, getApartmentTitle(apt), "needs_changes")} className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700" aria-label="طلب تعديلات من المالك">
                        <AlertCircle className="w-3.5 h-3.5" />
                        طلب تعديلات
                      </button>
                      <button type="button" onClick={() => openReviewDialog(apt._id, getApartmentTitle(apt), "reject")} className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700" aria-label="رفض الشقة">
                        <XCircle className="w-3.5 h-3.5" />
                        رفض
                      </button>
                      {getStatusInfo(apt) === STATUS_LABELS.approved && (
                        <button type="button" onClick={() => openReviewDialog(apt._id, getApartmentTitle(apt), "suspend")} className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600" aria-label="إيقاف الشقة مؤقتاً">
                          ⏸ إيقاف
                        </button>
                      )}
                      <button type="button" onClick={() => handleFeature(apt._id, !apt.isFeatured)} className={`clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${apt.isFeatured ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`} aria-label={apt.isFeatured ? "إلغاء تمييز الشقة" : "تمييز الشقة"}>
                        <Star className={`w-3.5 h-3.5 ${apt.isFeatured ? "fill-amber-400" : ""}`} />
                        {apt.isFeatured ? "مميزة" : "تمييز"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Review Dialog: سبب الرفض / طلب التعديلات / الإيقاف */}
        <Dialog open={reviewTarget !== null} onOpenChange={(open) => !open && setReviewTarget(null)}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {reviewTarget?.action === "reject" && "رفض الشقة"}
                {reviewTarget?.action === "needs_changes" && "طلب تعديلات من المالك"}
                {reviewTarget?.action === "suspend" && "إيقاف الشقة مؤقتاً"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[var(--muted-foreground)]">
              الشقة: <span className="font-medium text-[var(--foreground)]">{reviewTarget?.title}</span>
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                reviewTarget?.action === "needs_changes"
                  ? "اكتب الملاحظات المطلوب تعديلها (مثال: أضف صوراً أوضح للمطبخ، صحّح السعر)..."
                  : "اكتب سبب الرفض أو الإيقاف..."
              }
              rows={4}
              className="clay-input w-full text-sm resize-none"
              aria-label="سبب القرار"
            />
            {reviewTarget?.action === "reject" && !reason.trim() && (
              <p className="text-xs text-red-600">سبب الرفض مطلوب ليعرف المالك ما الذي يجب إصلاحه</p>
            )}
            <DialogFooter className="gap-2">
              <button type="button" onClick={() => setReviewTarget(null)} className="clay-sm px-4 py-2 text-sm">
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmReview}
                disabled={submitting || !reason.trim()}
                className="clay-btn px-4 py-2 text-sm disabled:opacity-50"
              >
                {submitting ? "جارٍ التنفيذ..." : "تأكيد"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Users Management */}
        {activeTab === "users" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {allUsers === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : (
              <div className="space-y-3">
                {allUsers.map((u) => (
                  <div key={u._id} className="clay p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--clay-accent-soft)] flex items-center justify-center text-sm font-bold text-[var(--clay-accent)] shrink-0">
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--foreground)]">{u.name || "بدون اسم"}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{u.email || "بدون بريد"}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {u.isDisabled && (
                        <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-semibold">معطّل</span>
                      )}
                      <select value={u.role || "user"} onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)} className="clay-input px-3 py-1.5 text-xs" aria-label={`دور ${u.name || u.email || "المستخدم"}`}>
                        <option value="user">مستخدم</option>
                        <option value="owner">مالك</option>
                        <option value="member">عضو</option>
                        <option value="admin">مدير</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleToggleDisable(u._id, !u.isDisabled, u.name || u.email || "")}
                        className={`clay-sm px-3 py-1.5 text-xs font-medium ${u.isDisabled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {u.isDisabled ? "تفعيل" : "تعطيل"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Bookings Management */}
        {activeTab === "bookings" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {adminBookings === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : adminBookings.length === 0 ? (
              <div className="clay p-8 text-center">
                <Calendar className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
                <h3 className="font-bold text-lg mb-1">لا توجد حجوزات</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {adminBookings.map((booking) => (
                  <div key={booking._id} className="clay p-4 flex flex-col md:flex-row gap-3 items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{booking.apartment?.title || "شقة"}</h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {new Date(booking.checkIn).toLocaleDateString("ar-SA")} — {new Date(booking.checkOut).toLocaleDateString("ar-SA")} · {booking.totalNights} ليلة · {booking.totalPrice.toLocaleString()} ر.س (عمولة {booking.platformFee.toLocaleString()})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                        booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                        booking.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {booking.status === "confirmed" ? "مؤكد" : booking.status === "pending" ? "قيد الانتظار" : booking.status === "cancelled" ? "ملغى" : "مكتمل"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" :
                        booking.paymentStatus === "refunded" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"
                      }`}>
                        {booking.paymentStatus === "paid" ? "مدفوع" : booking.paymentStatus === "refunded" ? "مسترد" : "غير مدفوع"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Finance Tab */}
        {activeTab === "finance" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="clay p-6 text-center">
              <DollarSign className="w-8 h-8 mx-auto text-[var(--muted-foreground)] mb-3" />
              <h3 className="font-bold mb-2">الإدارة المالية</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                تسجيل تحويلات مستحقات المالكين ومتابعة أرصدتهم — يعرض إيرادات المنصة أعلاه في بطاقات النظرة العامة.
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                واجهة تسجيل التحويلات الكاملة تُدار من دالة adminRecordPayout — جاهزة للربط بواجهة تفصيلية في المرحلة القادمة.
              </p>
            </div>
          </motion.div>
        )}

        {/* Activity Log */}
        {activeTab === "activity" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {activityLog === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : activityLog.length === 0 ? (
              <div className="clay p-8 text-center">
                <Shield className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
                <h3 className="font-bold text-lg mb-1">السجل فارغ</h3>
                <p className="text-sm text-[var(--muted-foreground)">ستظهر هنا كل الإجراءات الإدارية (قبول/رفض شقة، تغيير دور، تحويل...)</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activityLog.map((entry) => (
                  <div key={entry._id} className="clay p-3 flex flex-col md:flex-row md:items-center gap-2">
                    <span className="clay-sm px-2 py-1 text-[10px] font-mono bg-gray-50 w-fit" dir="ltr">{entry.action}</span>
                    <span className="text-sm text-[var(--foreground)] flex-1">{entry.details || entry.resourceType}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{new Date(entry.timestamp).toLocaleString("ar-SA")}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
