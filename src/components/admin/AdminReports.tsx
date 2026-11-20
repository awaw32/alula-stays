import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { Flag, CheckCircle2, MinusCircle, AlertTriangle, Send, Loader2, Phone, Home } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Id } from "@/convex/_generated/dataModel";

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
  const issueWarning = useMutation(api.admin.issueOwnerWarning);
  const [busy, setBusy] = useState<string | null>(null);

  // حالة مودال إصدار الإنذار للمالك
  const [warningTarget, setWarningTarget] = useState<{
    ownerId: Id<"users">;
    apartmentId?: Id<"apartments">;
    reportId?: Id<"reports">;
    ownerName: string;
    apartmentTitle?: string;
  } | null>(null);
  const [warningTitle, setWarningTitle] = useState("ملاحظة إدارية بشأن جودة الوحدة");
  const [warningReason, setWarningReason] = useState("");
  const [warningLevel, setWarningLevel] = useState<"first" | "second" | "final">("first");
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [issuing, setIssuing] = useState(false);

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

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningTarget) return;
    if (!warningReason.trim()) {
      toast.error("يرجى كتابة تفاصيل سبب الإنذار");
      return;
    }

    setIssuing(true);
    try {
      await issueWarning({
        ownerId: warningTarget.ownerId,
        apartmentId: warningTarget.apartmentId,
        reportId: warningTarget.reportId,
        title: warningTitle.trim(),
        reason: warningReason.trim(),
        level: warningLevel,
        sendWhatsApp,
      });

      toast.success(
        sendWhatsApp
          ? "تم إصدار الإنذار للمالك وإرسال رسالة واتساب رسمية بنجاح ⚠️📲"
          : "تم تسجيل الإنذار وإشعار المالك باللوحة بنجاح ⚠️"
      );

      // وضع البلاغ كمعالج تلقائياً
      if (warningTarget.reportId) {
        await resolve({
          reportId: warningTarget.reportId,
          resolved: true,
          note: `تم إصدار إنذار للمالك: ${warningTitle}`,
        });
      }

      setWarningTarget(null);
      setWarningReason("");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل إصدار الإنذار"));
    } finally {
      setIssuing(false);
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
        reports.map((report: any) => (
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
                    {TARGET_LABELS[report.targetType] || report.targetType}
                  </span>
                  <h3 className="font-bold text-sm">{REASON_LABELS[report.reason] || report.reason}</h3>
                </div>

                {/* بيانات الشقة والمالك إن كانت متاحة */}
                {report.targetTitle && (
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground)] font-semibold">
                    <span className="flex items-center gap-1 text-[var(--clay-accent)]">
                      <Home className="w-3.5 h-3.5" />
                      {report.targetTitle}
                    </span>
                    {report.ownerName && (
                      <span className="text-[var(--muted-foreground)]">
                        المالك: {report.ownerName}
                        {report.ownerPhone ? ` (${report.ownerPhone})` : ""}
                      </span>
                    )}
                  </div>
                )}

                {report.details && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1.5 leading-5">{report.details}</p>
                )}
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                  مُبلِّغ: {report.reporterName} · {new Date(report.createdAt).toLocaleDateString("ar-SA")}
                  {report.resolutionNote ? ` · ملاحظة المعالجة: ${report.resolutionNote}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {report.ownerId && report.status === "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      setWarningTarget({
                        ownerId: report.ownerId,
                        apartmentId: report.targetType === "apartment" ? report.targetId : undefined,
                        reportId: report._id,
                        ownerName: report.ownerName || "المالك",
                        apartmentTitle: report.targetTitle,
                      })
                    }
                    className="clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100"
                    title="توجيه إنذار رسمي للمالك بخصوص هذا البلاغ"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    إنذار للمالك
                  </button>
                )}

                {report.status === "pending" && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* مودال إصدار إنذار إداري لمالك الشقة */}
      <Dialog open={Boolean(warningTarget)} onOpenChange={(open) => !open && setWarningTarget(null)}>
        <DialogContent className="max-w-md bg-[var(--background)] border border-[var(--border)] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              إصدار إنذار إداري لمالك العقار
            </DialogTitle>
          </DialogHeader>

          {warningTarget && (
            <form onSubmit={handleSendWarning} className="space-y-4 mt-2 text-right">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border text-xs space-y-1">
                <div><strong>المستهدف:</strong> {warningTarget.ownerName}</div>
                {warningTarget.apartmentTitle && (
                  <div><strong>الوحدة:</strong> {warningTarget.apartmentTitle}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">درجة الإنذار</label>
                <select
                  value={warningLevel}
                  onChange={(e) => setWarningLevel(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-zinc-950 font-bold"
                >
                  <option value="first">⚠️ إنذار أول (تنبيه أولي)</option>
                  <option value="second">⚠️⚠️ إنذار ثانٍ (مخالفة متكررة)</option>
                  <option value="final">🚨 إنذار نهائي (قبل تعليق الحساب والشقق)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">عنوان الإنذار</label>
                <input
                  type="text"
                  value={warningTitle}
                  onChange={(e) => setWarningTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-zinc-950"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">تفاصيل وملاحظات الإنذار</label>
                <textarea
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  rows={4}
                  placeholder="اكتب أسباب الإنذار وتفاصيل البلاغ والمطلوب من المالك تصحيحه..."
                  className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-zinc-950 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sendWhatsAppCheck"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <label htmlFor="sendWhatsAppCheck" className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 cursor-pointer">
                  إرسال نسخة فورية من الإنذار إلى واتساب المالك 📲
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setWarningTarget(null)}
                  className="clay-sm px-4 py-2 text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="clay-btn px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5"
                >
                  {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  إصدار الإنذار الآن
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
