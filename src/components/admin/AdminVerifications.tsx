import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { BadgeCheck, ExternalLink, XCircle, CheckCircle2 } from "lucide-react";

const OWNER_TYPE_LABELS: Record<string, string> = {
  individual: "مالك فرد",
  company: "شركة",
  property_manager: "مدير عقار",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: "هوية وطنية",
  commercial_register: "سجل تجاري",
};

export function AdminVerifications() {
  const verifications = useQuery(api.identity.adminAllVerifications, {});
  const review = useMutation(api.identity.adminReviewVerification);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleApprove = async (id: string) => {
    setBusy(true);
    try {
      await review({ verificationId: id as never, approved: true });
      toast.success("تم قبول التحقق وتوثيق المالك");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر قبول الطلب"));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setBusy(true);
    try {
      await review({ verificationId: id as never, approved: false, rejectionReason: rejectReason });
      toast.success("تم رفض الطلب وإبلاغ المالك");
      setRejecting(null);
      setRejectReason("");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر رفض الطلب"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {verifications === undefined ? (
        <div className="clay p-6 animate-pulse h-40" />
      ) : verifications.length === 0 ? (
        <div className="clay p-8 text-center">
          <BadgeCheck className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
          <h3 className="font-bold text-lg mb-1">لا توجد طلبات تحقق</h3>
          <p className="text-sm text-[var(--muted-foreground)]">ستظهر هنا طلبات توثيق هوية المالكين</p>
        </div>
      ) : (
        verifications.map((v) => (
          <div key={v._id} className="clay p-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm">{v.fullName}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  v.status === "pending" ? "bg-amber-100 text-amber-700" :
                  v.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {v.status === "pending" ? "قيد المراجعة" : v.status === "approved" ? "مقبول" : "مرفوض"}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {OWNER_TYPE_LABELS[v.ownerType]} · {DOC_TYPE_LABELS[v.documentType]} · {new Date(v.createdAt).toLocaleDateString("ar-SA")}
                {v.rejectionReason ? ` · سبب الرفض: ${v.rejectionReason}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${v.documentStorageId}`}
                target="_blank"
                rel="noreferrer"
                className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                عرض الوثيقة
              </a>
              {v.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(v._id)}
                    disabled={busy}
                    className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejecting(rejecting === v._id ? null : v._id)}
                    className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    رفض
                  </button>
                </>
              )}
            </div>
            {rejecting === v._id && (
              <div className="w-full md:w-auto flex gap-2 md:col-span-full">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="سبب الرفض (إلزامي)"
                  className="clay-input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleReject(v._id)}
                  disabled={busy || !rejectReason.trim()}
                  className="clay-btn px-4 py-2 text-sm disabled:opacity-50"
                >
                  تأكيد الرفض
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
