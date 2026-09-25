import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { Settings, Loader2 } from "lucide-react";

interface FormState {
  brandName: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  instagram: string;
  twitter: string;
  paymentProvider: string;
  emailProvider: string;
  mapsProvider: string;
}

const EMPTY: FormState = {
  brandName: "", contactEmail: "", contactPhone: "", whatsapp: "",
  instagram: "", twitter: "", paymentProvider: "", emailProvider: "",
  mapsProvider: "",
};

export function AdminSettings() {
  const settings = useQuery(api.settings.get, {});
  const updateSettings = useMutation(api.settings.update);
  const [saving, setSaving] = useState(false);

  // key مبني على updatedAt: عند وصول الإعدادات أول مرة (أو بعد حفظ)
  // يُعاد تركيب SettingsForm بقيم ابتدائية جديدة — بلا setState داخل effect
  const formKey = settings ? `s-${settings.updatedAt ?? 0}` : "loading";

  const handleSave = async (values: FormState) => {
    setSaving(true);
    try {
      const result = await updateSettings({
        brandName: values.brandName || undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        whatsapp: values.whatsapp || undefined,
        instagram: values.instagram || undefined,
        twitter: values.twitter || undefined,
        paymentProvider: values.paymentProvider || undefined,
        emailProvider: values.emailProvider || undefined,
        mapsProvider: values.mapsProvider || undefined,
      });
      toast.success(result);
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر حفظ الإعدادات"));
    } finally {
      setSaving(false);
    }
  };

  if (settings === undefined) {
    return <div className="clay p-6 animate-pulse h-64" />;
  }

  return (
    <SettingsForm
      key={formKey}
      initial={settings ? {
        brandName: settings.brandName ?? "",
        contactEmail: settings.contactEmail ?? "",
        contactPhone: settings.contactPhone ?? "",
        whatsapp: settings.whatsapp ?? "",
        instagram: settings.instagram ?? "",
        twitter: settings.twitter ?? "",
        paymentProvider: settings.paymentProvider ?? "",
        emailProvider: settings.emailProvider ?? "",
        mapsProvider: settings.mapsProvider ?? "",
      } : EMPTY}
      saving={saving}
      onSubmit={handleSave}
    />
  );
}

function SettingsForm({
  initial,
  saving,
  onSubmit,
}: {
  initial: FormState;
  saving: boolean;
  onSubmit: (values: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((c) => ({ ...c, [k]: v }));

  const inputCls = "clay-input w-full";
  const labelCls = "block text-xs text-[var(--muted-foreground)] mb-1";

  return (
    <div className="space-y-4">
      <div className="clay p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          إعدادات المنصة
        </h3>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div>
            <label htmlFor="st-brand" className={labelCls}>اسم العلامة التجارية</label>
            <input id="st-brand" type="text" value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="شقق العلا" className={inputCls} />
          </div>
          <div>
            <label htmlFor="st-email" className={labelCls}>البريد الرسمي</label>
            <input id="st-email" type="email" dir="ltr" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="info@example.com" className={inputCls} />
          </div>
          <div>
            <label htmlFor="st-phone" className={labelCls}>رقم التواصل</label>
            <input id="st-phone" type="tel" dir="ltr" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+966-5X-XXX-XXXX" className={inputCls} />
          </div>
          <div>
            <label htmlFor="st-whatsapp" className={labelCls}>واتساب</label>
            <input id="st-whatsapp" type="tel" dir="ltr" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+966-5X-XXX-XXXX" className={inputCls} />
          </div>
          <div>
            <label htmlFor="st-instagram" className={labelCls}>إنستغرام (رابط)</label>
            <input id="st-instagram" type="url" dir="ltr" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputCls} />
          </div>
          <div>
            <label htmlFor="st-twitter" className={labelCls}>X / تويتر (رابط)</label>
            <input id="st-twitter" type="url" dir="ltr" value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="https://x.com/..." className={inputCls} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div>
            <label htmlFor="st-payment" className={labelCls}>بوابة الدفع</label>
            <select id="st-payment" value={form.paymentProvider} onChange={(e) => set("paymentProvider", e.target.value)} className={inputCls}>
              <option value="">— غير محدد —</option>
              <option value="moyasar">Moyasar</option>
              <option value="tap">Tap Payments</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>
          <div>
            <label htmlFor="st-email-provider" className={labelCls}>مزود البريد</label>
            <select id="st-email-provider" value={form.emailProvider} onChange={(e) => set("emailProvider", e.target.value)} className={inputCls}>
              <option value="">— غير محدد —</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="none">بدون</option>
            </select>
          </div>
          <div>
            <label htmlFor="st-maps" className={labelCls}>مزود الخرائط</label>
            <select id="st-maps" value={form.mapsProvider} onChange={(e) => set("mapsProvider", e.target.value)} className={inputCls}>
              <option value="">— غير محدد —</option>
              <option value="openstreetmap">OpenStreetMap</option>
              <option value="google">Google Maps</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 leading-6">
          🔐 <strong>المفاتيح الحقيقية</strong> لا تُخزَّن هنا — أضِفها في
          <a href="https://dashboard.convex.dev" target="_blank" rel="noreferrer" className="underline mx-1">Convex Dashboard</a>
          ← Settings ← Environment Variables (مثل STRIPE_SECRET_KEY وSTRIPE_WEBHOOK_SECRET). هنا تسجّل المزود فقط.
        </div>

        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={saving}
          className="clay-btn px-5 py-2.5 text-sm mt-4 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
