import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { Flag, CheckCircle2, MinusCircle } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  inaccurate: "بيانات غير دقيقة",
  inappropriate_images: "صور غير لائقة",
  misleading: "وصف مضلل",
  scam: "احتيال مشتبه",
  other: "أخرى",
};

const TARGET_LABELS: Record<string, string> = {
  apartment: "شقة",
  review: "تقييم",
  user: "مستخدم",
};

export function AdminReports() {
  const reports = useQuery(api.reports.adminAllReports, {});
  const resolve = useMutation(api.reports.adminResolveReport);
  const [busy, setBusy] = useState<string | null>(null);

  const handleResolve = async (id: string, resolved: boolean) => {
    setBusy(id);
    try {
      await resolve({ reportId: id as never, resolved });
      toast.success(resolved ? "تمت معالجة البلاغ" : "تم تجاهل البلاغ");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث البلاغ"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {reports === undefined ? (
        <div className="clay p-6 animate-pulse h-40" />
      ) : reports.length === 0 ? (
        <div className="clay p-8 text-center">
          <Flag className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
          <h3 className="font-bold text-lg mb-1">لا توجد بلاغات</h3>
          <p className="text-sm text-[var(--muted-foreground)]">ستظهر هنا بلاغات المستخدمين عن الشقق والتقييمات</p>
        </div>
      ) : (
        reports.map((report) => (
          <div key={report._id} className="clay p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    report.status === "pending" ? "bg-amber-100 text-amber-700" :
                    report.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {report.status === "pending" ? "بانتظار المعالجة" : report.status === "resolved" ? "معالج" : "متجاهل"}
                  </span>
                  <span className="clay-sm px-2 py-0.5 text-[10px] font-medium bg-gray-50">
                    {TARGET_LABELS[report.targetType]}
                  </span>
                  <h3 className="font-bold text-sm">{REASON_LABELS[report.reason]}</h3>
                </div>
                {report.details && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1.5 leading-5">{report.details}</p>
                )}
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                  مُبلِّغ: {report.reporterName} · {new Date(report.createdAt).toLocaleDateString("ar-SA")}
                  {report.resolutionNote ? ` · ملاحظة المعالجة: ${report.resolutionNote}` : ""}
                </p>
              </div>
              {report.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResolve(report._id, true)}
                    disabled={busy === report._id}
                    className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    معالجة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(report._id, false)}
                    disabled={busy === report._id}
                    className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 disabled:opacity-50"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    تجاهل
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
