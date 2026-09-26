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
import { AdminPayouts } from "@/components/admin/AdminPayouts";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminVerifications } from "@/components/admin/AdminVerifications";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminInvoices } from "@/components/admin/AdminInvoices";
import { FileText, CreditCard, Search as SearchIcon, ArrowUpRight, Phone, Mail } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<
    | "stats"
    | "invoices"
    | "apartments"
    | "users"
    | "bookings"
    | "finance"
    | "verifications"
    | "reports"
    | "settings"
    | "activity"
  >("stats");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "year" | "all">("today");
  const [userSearch, setUserSearch] = useState<string>("");
  const [userFilter, setUserFilter] = useState<"all" | "paid" | "pending" | "owners" | "requests">("all");
  const ownerRequests = useQuery(
    api.owners.adminListOwnerRequests,
    DEMO_MODE ? "skip" : { status: "all" }
  );
  const approveOwnerRequest = useMutation(api.owners.adminApproveOwnerRequest);
  const rejectOwnerRequest = useMutation(api.owners.adminRejectOwnerRequest);
  const [processingOwnerReq, setProcessingOwnerReq] = useState<string | null>(null);
  const [rejectOwnerTarget, setRejectOwnerTarget] = useState<{ id: Id<"ownerRequests">; name: string } | null>(null);
  const [ownerRejectReason, setOwnerRejectReason] = useState("");
  const pendingOwnerRequests = ownerRequests?.filter((r) => r.status === "pending") || [];
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

        {/* Stats Cards with Time Range Filter */}
        {stats && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mt-6 mb-8 space-y-4">
            {/* Period Selector Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">إحصائيات المنصة والأرباح وحركة الزوار</h3>
                <p className="text-xs text-[var(--muted-foreground)]">بيانات حية ومباشرة للزوار والإيرادات وعمليات الدفع</p>
              </div>
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="فترة الإحصائيات">
                {[
                  { id: "today", label: "اليوم" },
                  { id: "week", label: "آخر 7 أيام" },
                  { id: "month", label: "آخر 30 يوماً" },
                  { id: "year", label: "هذا العام" },
                  { id: "all", label: "الإجمالي" },
                ].map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setTimeRange(range.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      timeRange === range.id
                        ? "bg-[var(--clay-accent)] text-white shadow-sm"
                        : "bg-[var(--clay-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Period Metrics */}
            {(() => {
              const current = (stats as any)?.[timeRange] || stats?.all || {};
              const periodLabel = timeRange === "today" ? "اليوم" : timeRange === "week" ? "الأسبوع" : timeRange === "month" ? "الشهر" : timeRange === "year" ? "السنة" : "الكل";

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* الزوار */}
                  <div className="clay p-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">
                      {(current.uniqueVisitors ?? 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      زوار فريدون ({periodLabel})
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                      {(current.pageViews ?? 0).toLocaleString()} مشاهدة صفحة
                    </div>
                  </div>

                  {/* إجمالي المبيعات */}
                  <div className="clay p-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {(current.revenue ?? 0).toLocaleString()} ر.س
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      مبيعات الحجوزات ({periodLabel})
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                      عمولة المنصة (10%): +{(current.platformProfit ?? 0).toLocaleString()} ر.س
                    </div>
                  </div>

                  {/* الحجوزات المسددة */}
                  <div className="clay p-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">
                      {current.paidBookingsCount ?? 0}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      حجوزات مسددة ومؤكدة
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      إجمالي الطلبات: {current.bookingsCount ?? 0}
                    </div>
                  </div>

                  {/* محاولات الدفع والمعلقة */}
                  <div className="clay p-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {current.pendingBookingsCount ?? 0}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      محاولات دفع معلقة
                    </div>
                    <div className="text-[11px] text-red-500 mt-1">
                      ملغية / مستردة: {current.cancelledBookingsCount ?? 0}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Platform Overall Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="clay p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[var(--foreground)]">{stats.totalUsers}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">المستخدمون المسجلون</div>
                </div>
              </div>

              <div className="clay p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[var(--foreground)]">{stats.totalApartments}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">الشقق المسجلة</div>
                </div>
              </div>

              <div className="clay p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-orange-600">{stats.pendingVerification}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">بانتظار مراجعة الإدارة</div>
                </div>
              </div>

              <div className="clay p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[var(--foreground)]">{stats.avgRating} ★</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">متوسط تقييم الشقق</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="أقسام لوحة الإدارة">
          {[
            ["stats", "نظرة عامة والزوار"],
            ["invoices", "الفواتير وأوامر الشراء"],
            ["apartments", "الشقق"],
            ["bookings", "الحجوزات"],
            [
              "users",
              `المستخدمون والزوار${pendingOwnerRequests.length > 0 ? ` (${pendingOwnerRequests.length} طلب جديد)` : ""}`,
            ],
            ["finance", "المالية"],
            ["verifications", "توثيق الهويات"],
            ["reports", "البلاغات"],
            ["settings", "الإعدادات"],
            ["activity", "سجل النشاط"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab as any)}
              className={`clay-sm px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === tab ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Invoices Management Tab */}
        {activeTab === "invoices" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <AdminInvoices />
          </motion.div>
        )}

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

        {/* Dialog رفض طلب المالك */}
        <Dialog open={rejectOwnerTarget !== null} onOpenChange={(open) => !open && setRejectOwnerTarget(null)}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>رفض طلب انضمام المالك: {rejectOwnerTarget?.name}</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-[var(--muted-foreground)]">
              اكتب سبب الرفض أو الملاحظات التي ستصل لمقدم الطلب في لوحته:
            </p>
            <textarea
              value={ownerRejectReason}
              onChange={(e) => setOwnerRejectReason(e.target.value)}
              placeholder="مثال: يرجى تزويدنا برقم جوال بديل، أو العقار خارج النطاق المشمول حالياً..."
              rows={3}
              className="clay-input w-full text-xs resize-none"
            />
            <DialogFooter className="gap-2">
              <button type="button" onClick={() => setRejectOwnerTarget(null)} className="clay-sm px-4 py-2 text-xs">
                إلغاء
              </button>
              <button
                type="button"
                disabled={processingOwnerReq !== null}
                onClick={async () => {
                  if (!rejectOwnerTarget) return;
                  setProcessingOwnerReq(rejectOwnerTarget.id);
                  try {
                    await rejectOwnerRequest({
                      requestId: rejectOwnerTarget.id,
                      reason: ownerRejectReason.trim() || undefined,
                    });
                    toast.success("تم تسجيل رفض الطلب وإشعار المستخدم");
                    setRejectOwnerTarget(null);
                  } catch (err) {
                    toast.error(getErrorMessage(err, "تعذر رفض الطلب"));
                  } finally {
                    setProcessingOwnerReq(null);
                  }
                }}
                className="clay-btn px-4 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                {processingOwnerReq ? "جارٍ التنفيذ..." : "تأكيد الرفض"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Users Management */}
        {activeTab === "users" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
            {/* قسم طلبات الملاك المعلقة بانتظار الاعتماد */}
            {pendingOwnerRequests.length > 0 && (
              <div className="clay p-5 border-2 border-amber-500/40 bg-amber-500/5 rounded-2xl mb-4">
                <div className="flex items-center justify-between gap-3 mb-3 border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-lg">
                      ⏳
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--foreground)]">
                        طلبات انضمام الملاك الجدد بانتظار الاعتماد ({pendingOwnerRequests.length})
                      </h3>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        طلب هؤلاء المستخدمون تفعيل حساباتهم كـ "مالك عقار" لنشر الشقق واستقبال الحجوزات
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {pendingOwnerRequests.map((req) => (
                    <div
                      key={req._id}
                      className="clay-sm p-4 bg-white dark:bg-zinc-900 border border-amber-300/40 dark:border-amber-900/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-[var(--foreground)]">{req.fullName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            طلب مالك جديد
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {new Date(req.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1 font-mono dir-ltr">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <a href={`tel:${req.phone}`} className="hover:underline">{req.phone}</a>
                          </span>
                          {req.userEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {req.userEmail}
                            </span>
                          )}
                          <span>📍 {req.city}</span>
                          <span>🏠 {req.propertyCount ?? 1} وحدة ({req.propertyTypes || "شقق"})</span>
                        </div>

                        {req.notes && (
                          <p className="text-xs bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 p-2 rounded-lg border border-amber-200/50">
                            💬 ملاحظات المالك: {req.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                        <a
                          href={`https://wa.me/${req.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="clay-sm px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold flex items-center gap-1"
                        >
                          واتساب
                        </a>
                        <button
                          type="button"
                          disabled={processingOwnerReq === req._id}
                          onClick={async () => {
                            setProcessingOwnerReq(req._id);
                            try {
                              await approveOwnerRequest({ requestId: req._id });
                              toast.success(`تم قبول طلب المالك ${req.fullName} وتفعيل لوحته بنجاح`);
                            } catch (err) {
                              toast.error(getErrorMessage(err, "تعذر قبول الطلب"));
                            } finally {
                              setProcessingOwnerReq(null);
                            }
                          }}
                          className="clay-btn px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>قبول كمالك عقار</span>
                        </button>
                        <button
                          type="button"
                          disabled={processingOwnerReq === req._id}
                          onClick={() => {
                            setRejectOwnerTarget({ id: req._id, name: req.fullName });
                            setOwnerRejectReason("");
                          }}
                          className="clay-sm px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 font-medium flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Search & Filter Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)]">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {[
                  { id: "all", label: "كافة المسجلين" },
                  { id: "requests", label: `طلبات الملاك (${pendingOwnerRequests.length})` },
                  { id: "owners", label: "ملاك العقارات" },
                  { id: "paid", label: "أصحاب الحجوزات المسددة" },
                  { id: "pending", label: "محاولات الدفع المعلقة" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setUserFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      userFilter === tab.id
                        ? "bg-[var(--clay-accent)] text-white shadow-sm"
                        : "bg-[var(--clay-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="بحث باسم المستخدم، الإيميل، الجوال..."
                  className="clay-input pr-9 pl-3 py-1.5 text-xs w-full"
                />
              </div>
            </div>

            {allUsers === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : userFilter === "requests" ? (
              ownerRequests === undefined ? (
                <div className="clay p-6 animate-pulse h-40" />
              ) : ownerRequests.length === 0 ? (
                <div className="clay p-12 text-center text-zinc-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                  <h3 className="font-bold text-base text-[var(--foreground)]">لا توجد طلبات انضمام كملاك</h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {ownerRequests.map((req) => (
                    <div
                      key={req._id}
                      className="clay p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-[var(--foreground)]">{req.fullName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              req.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : req.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {req.status === "approved"
                              ? "معتمد كمالك ✓"
                              : req.status === "rejected"
                              ? "مرفوض ✕"
                              : "قيد المراجعة ⏳"}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {new Date(req.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1 font-mono dir-ltr">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <a href={`tel:${req.phone}`} className="hover:underline">{req.phone}</a>
                          </span>
                          {req.userEmail && <span>{req.userEmail}</span>}
                          <span>📍 {req.city}</span>
                          <span>🏠 {req.propertyCount ?? 1} وحدة ({req.propertyTypes || "شقق"})</span>
                        </div>
                        {req.rejectionReason && (
                          <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                            سبب الرفض: {req.rejectionReason}
                          </p>
                        )}
                        {req.notes && (
                          <p className="text-xs bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg">
                            ملاحظات: {req.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://wa.me/${req.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="clay-sm px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                        >
                          واتساب
                        </a>
                        {req.status !== "approved" && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await approveOwnerRequest({ requestId: req._id });
                                toast.success(`تم قبول طلب ${req.fullName}`);
                              } catch (err) {
                                toast.error(getErrorMessage(err, "تعذر قبول الطلب"));
                              }
                            }}
                            className="clay-btn px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white"
                          >
                            اعتماد
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (() => {
              const filteredUsers = allUsers.filter((u) => {
                if (userFilter === "paid" && !(u as any).paidBookingsCount) return false;
                if (userFilter === "pending" && !(u as any).pendingBookingsCount) return false;
                if (userFilter === "owners" && u.role !== "owner") return false;
                if (userSearch.trim()) {
                  const term = userSearch.trim().toLowerCase();
                  const matchName = u.name?.toLowerCase().includes(term);
                  const matchEmail = u.email?.toLowerCase().includes(term);
                  const matchPhone = (u as any).phone?.includes(term);
                  return matchName || matchEmail || matchPhone;
                }
                return true;
              });

              if (filteredUsers.length === 0) {
                return (
                  <div className="clay p-12 text-center text-zinc-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                    <h3 className="font-bold text-base text-[var(--foreground)]">لا يوجد مستخدمون مطابقون</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">جرّب تغيير عبارة البحث أو التصفية</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredUsers.map((u) => {
                    const phone = (u as any).phone;
                    const paidCount = (u as any).paidBookingsCount || 0;
                    const pendingCount = (u as any).pendingBookingsCount || 0;
                    const totalSpent = (u as any).totalSpent || 0;

                    return (
                      <div key={u._id} className="clay p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[var(--clay-accent-soft)] flex items-center justify-center text-sm font-bold text-[var(--clay-accent)] shrink-0 mt-0.5">
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm text-[var(--foreground)]">{u.name || "بدون اسم"}</h3>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[var(--muted-foreground)]">
                                {u.role === "admin" ? "مدير نظام" : u.role === "owner" ? "مالك عقار" : "مستخدم / ضيف"}
                              </span>
                              {u.isDisabled && (
                                <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-semibold">معطّل</span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                              {u.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {u.email}
                                </span>
                              )}
                              {phone && (
                                <span className="flex items-center gap-1 font-mono dir-ltr">
                                  <Phone className="w-3 h-3 text-emerald-600" /> {phone}
                                </span>
                              )}
                              {(u as any).city && <span>{(u as any).city}</span>}
                            </div>

                            {/* سجل الدفع والحجوزات */}
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium">
                                مدفوع: {totalSpent.toLocaleString()} ر.س ({paidCount} حجز)
                              </span>
                              {pendingCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                                  {pendingCount} محاولة دفع لم تكتمل
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls & Actions */}
                        <div className="shrink-0 flex flex-wrap items-center gap-2 self-end md:self-center">
                          {phone && (
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="clay-sm px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold flex items-center gap-1"
                            >
                              واتساب
                            </a>
                          )}
                          <select
                            value={u.role || "user"}
                            onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                            className="clay-input px-3 py-1.5 text-xs"
                            aria-label={`دور ${u.name || u.email || "المستخدم"}`}
                          >
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
                    );
                  })}
                </div>
              );
            })()}
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
            <AdminPayouts users={allUsers ?? []} />
          </motion.div>
        )}

        {/* Identity Verifications */}
        {activeTab === "verifications" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <AdminVerifications />
          </motion.div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <AdminReports />
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <AdminSettings />
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
