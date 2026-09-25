import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { BadgeCheck, Loader2, ShieldAlert, Upload } from "lucide-react";

/**
 * توثيق هوية المالك: رفع هوية وطنية أو سجل تجاري ثم انتظار مراجعة الإدارة.
 */
export function OwnerIdentityVerification() {
  const verification = useQuery(api.identity.myVerification, {});
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const submit = useMutation(api.identity.submitVerification);

  const [ownerType, setOwnerType] = useState<"individual" | "company" | "property_manager">("individual");
  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState<"national_id" | "commercial_register">("national_id");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const status = verification?.status ?? "none";

  const handleUpload = async () => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("الصورة تتجاوز 8MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("المسموح: صورة JPG/PNG/WebP أو PDF");
      return;
    }

    setBusy(true);
    try {
      // رفع الوثيقة إلى تخزين Convex
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("فشل رفع الوثيقة");
      const { storageId } = (await result.json()) as { storageId: string };

      const message = await submit({
        ownerType,
        fullName,
        documentType,
        documentStorageId: storageId,
      });
      toast.success(message);
      setFile(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر إرسال طلب التحقق"));
    } finally {
      setBusy(false);
    }
  };

  // الحالة النشطة
  if (status === "pending") {
    return (
      <div className="clay p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <div>
          <p className="font-medium text-sm">طلب التوثيق قيد المراجعة</p>
          <p className="text-xs text-[var(--muted-foreground)]">ستُبلغ بالقرار عبر الإشعارات</p>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="clay p-4 flex items-center gap-3 bg-emerald-50/50">
        <BadgeCheck className="w-5 h-5 text-emerald-600" />
        <p className="font-medium text-sm text-emerald-800">حسابك موثّق من الإدارة ✓</p>
      </div>
    );
  }

  return (
    <div className="clay p-4">
      <h3 className="font-bold mb-1 flex items-center gap-2 text-sm">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        توثيق الهوية (اختياري لكن يزيد ثقة الضيوف)
      </h3>
      {status === "rejected" && verification?.rejectionReason && (
        <p className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-2">
          رُفض الطلب السابق — السبب: {verification.rejectionReason}
        </p>
      )}

      <div className="grid md:grid-cols-4 gap-3 mt-3">
        <div>
          <label htmlFor="iv-ownerType" className="block text-xs text-[var(--muted-foreground)] mb-1">نوع الملكية</label>
          <select id="iv-ownerType" value={ownerType} onChange={(e) => setOwnerType(e.target.value as typeof ownerType)} className="clay-input w-full text-sm">
            <option value="individual">مالك فرد</option>
            <option value="company">شركة</option>
            <option value="property_manager">مدير عقار</option>
          </select>
        </div>
        <div>
          <label htmlFor="iv-name" className="block text-xs text-[var(--muted-foreground)] mb-1">الاسم الرسمي</label>
          <input id="iv-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="كما في الوثيقة" className="clay-input w-full text-sm" />
        </div>
        <div>
          <label htmlFor="iv-docType" className="block text-xs text-[var(--muted-foreground)] mb-1">نوع الوثيقة</label>
          <select id="iv-docType" value={documentType} onChange={(e) => setDocumentType(e.target.value as typeof documentType)} className="clay-input w-full text-sm">
            <option value="national_id">هوية وطنية</option>
            <option value="commercial_register">سجل تجاري</option>
          </select>
        </div>
        <div>
          <label htmlFor="iv-file" className="block text-xs text-[var(--muted-foreground)] mb-1">الوثيقة (صورة/PDF، ≤8MB)</label>
          <input
            id="iv-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs file:clay-btn file:mr-2 file:text-xs"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleUpload}
        disabled={busy || !file || !fullName.trim()}
        className="clay-btn px-4 py-2 text-sm mt-3 disabled:opacity-50 flex items-center gap-2"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        إرسال طلب التوثيق
      </button>
    </div>
  );
}
