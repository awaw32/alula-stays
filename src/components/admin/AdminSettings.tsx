import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { Settings, Loader2, Shield, Type, Sparkles, Building2, HelpCircle } from "lucide-react";

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
  tourismLicenseNumber: string;
  isTourismLicensed: boolean;

  // العبارات والنصوص التسويقية الرئيسية
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  destinationsTitle: string;
  heritageSectionTitle: string;
  heritageSectionSubtitle: string;
  mountainSectionTitle: string;
  mountainSectionSubtitle: string;
  oasisSectionTitle: string;
  oasisSectionSubtitle: string;
  villasSectionTitle: string;
  villasSectionSubtitle: string;
  hostBannerBadge: string;
  hostBannerTitle: string;
  hostBannerSubtitle: string;
  footerDescription: string;
  trustFeature1Title: string;
  trustFeature1Desc: string;
  trustFeature2Title: string;
  trustFeature2Desc: string;
  trustFeature3Title: string;
  trustFeature3Desc: string;
}

const EMPTY: FormState = {
  brandName: "",
  contactEmail: "",
  contactPhone: "",
  whatsapp: "",
  instagram: "",
  twitter: "",
  paymentProvider: "",
  emailProvider: "",
  mapsProvider: "",
  tourismLicenseNumber: "",
  isTourismLicensed: false,
  heroBadge: "",
  heroTitle: "",
  heroSubtitle: "",
  destinationsTitle: "",
  heritageSectionTitle: "",
  heritageSectionSubtitle: "",
  mountainSectionTitle: "",
  mountainSectionSubtitle: "",
  oasisSectionTitle: "",
  oasisSectionSubtitle: "",
  villasSectionTitle: "",
  villasSectionSubtitle: "",
  hostBannerBadge: "",
  hostBannerTitle: "",
  hostBannerSubtitle: "",
  footerDescription: "",
  trustFeature1Title: "",
  trustFeature1Desc: "",
  trustFeature2Title: "",
  trustFeature2Desc: "",
  trustFeature3Title: "",
  trustFeature3Desc: "",
};

export function AdminSettings() {
  const settings = useQuery(api.settings.get, {});
  const updateSettings = useMutation(api.settings.update);
  const [saving, setSaving] = useState(false);

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
        tourismLicenseNumber: values.tourismLicenseNumber || undefined,
        isTourismLicensed: values.isTourismLicensed,
        heroBadge: values.heroBadge || undefined,
        heroTitle: values.heroTitle || undefined,
        heroSubtitle: values.heroSubtitle || undefined,
        destinationsTitle: values.destinationsTitle || undefined,
        heritageSectionTitle: values.heritageSectionTitle || undefined,
        heritageSectionSubtitle: values.heritageSectionSubtitle || undefined,
        mountainSectionTitle: values.mountainSectionTitle || undefined,
        mountainSectionSubtitle: values.mountainSectionSubtitle || undefined,
        oasisSectionTitle: values.oasisSectionTitle || undefined,
        oasisSectionSubtitle: values.oasisSectionSubtitle || undefined,
        villasSectionTitle: values.villasSectionTitle || undefined,
        villasSectionSubtitle: values.villasSectionSubtitle || undefined,
        hostBannerBadge: values.hostBannerBadge || undefined,
        hostBannerTitle: values.hostBannerTitle || undefined,
        hostBannerSubtitle: values.hostBannerSubtitle || undefined,
        footerDescription: values.footerDescription || undefined,
        trustFeature1Title: values.trustFeature1Title || undefined,
        trustFeature1Desc: values.trustFeature1Desc || undefined,
        trustFeature2Title: values.trustFeature2Title || undefined,
        trustFeature2Desc: values.trustFeature2Desc || undefined,
        trustFeature3Title: values.trustFeature3Title || undefined,
        trustFeature3Desc: values.trustFeature3Desc || undefined,
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
      initial={
        settings
          ? {
              brandName: settings.brandName ?? "",
              contactEmail: settings.contactEmail ?? "",
              contactPhone: settings.contactPhone ?? "",
              whatsapp: settings.whatsapp ?? "",
              instagram: settings.instagram ?? "",
              twitter: settings.twitter ?? "",
              paymentProvider: settings.paymentProvider ?? "",
              emailProvider: settings.emailProvider ?? "",
              mapsProvider: settings.mapsProvider ?? "",
              tourismLicenseNumber: (settings as any).tourismLicenseNumber ?? "",
              isTourismLicensed: Boolean((settings as any).isTourismLicensed),
              heroBadge: (settings as any).heroBadge ?? "",
              heroTitle: (settings as any).heroTitle ?? "",
              heroSubtitle: (settings as any).heroSubtitle ?? "",
              destinationsTitle: (settings as any).destinationsTitle ?? "",
              heritageSectionTitle: (settings as any).heritageSectionTitle ?? "",
              heritageSectionSubtitle: (settings as any).heritageSectionSubtitle ?? "",
              mountainSectionTitle: (settings as any).mountainSectionTitle ?? "",
              mountainSectionSubtitle: (settings as any).mountainSectionSubtitle ?? "",
              oasisSectionTitle: (settings as any).oasisSectionTitle ?? "",
              oasisSectionSubtitle: (settings as any).oasisSectionSubtitle ?? "",
              villasSectionTitle: (settings as any).villasSectionTitle ?? "",
              villasSectionSubtitle: (settings as any).villasSectionSubtitle ?? "",
              hostBannerBadge: (settings as any).hostBannerBadge ?? "",
              hostBannerTitle: (settings as any).hostBannerTitle ?? "",
              hostBannerSubtitle: (settings as any).hostBannerSubtitle ?? "",
              footerDescription: (settings as any).footerDescription ?? "",
              trustFeature1Title: (settings as any).trustFeature1Title ?? "",
              trustFeature1Desc: (settings as any).trustFeature1Desc ?? "",
              trustFeature2Title: (settings as any).trustFeature2Title ?? "",
              trustFeature2Desc: (settings as any).trustFeature2Desc ?? "",
              trustFeature3Title: (settings as any).trustFeature3Title ?? "",
              trustFeature3Desc: (settings as any).trustFeature3Desc ?? "",
            }
          : EMPTY
      }
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
  const [activeSubTab, setActiveSubTab] = useState<"copy" | "general" | "license" | "services">("copy");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((c) => ({ ...c, [k]: v }));

  const inputCls = "clay-input w-full";
  const labelCls = "block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1";
  const hintCls = "block text-[11px] text-[var(--muted-foreground)] mt-1";

  return (
    <div className="space-y-6">
      {/* ─── Navigation Tabs for Settings ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("copy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeSubTab === "copy"
              ? "bg-[var(--clay-accent)] text-white shadow-md"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
          }`}
        >
          <Type className="w-4 h-4" />
          <span>العبارات والنصوص الرئيسية بالموقع</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("license")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeSubTab === "license"
              ? "bg-[var(--clay-accent)] text-white shadow-md"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>الترخيص السياحي والاعتماد</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("general")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeSubTab === "general"
              ? "bg-[var(--clay-accent)] text-white shadow-md"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>العلامة التجارية والتواصل</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("services")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeSubTab === "services"
              ? "bg-[var(--clay-accent)] text-white shadow-md"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>بوابات الدفع والمزودات</span>
        </button>
      </div>

      {/* ─── 1. تبويب تعديل العبارات والنصوص الرئيسية ─── */}
      {activeSubTab === "copy" && (
        <div className="space-y-6">
          {/* قسم الهيرو الترحيبي */}
          <div className="clay p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <Sparkles className="w-5 h-5 text-[var(--clay-accent)]" />
              <div>
                <h4 className="font-black text-sm text-neutral-900 dark:text-neutral-100">
                  نصوص واجهة الترحيب الرئيسية (الهيرو)
                </h4>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  العبارات الكبيرة التي تظهر في أعلى الصفحة الرئيسية فوق معرض الصور
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="st-hero-badge" className={labelCls}>شارة الهيرو العلوية</label>
                <input
                  id="st-hero-badge"
                  type="text"
                  value={form.heroBadge}
                  onChange={(e) => set("heroBadge", e.target.value)}
                  placeholder="منصة شقق وإقامات العلا المعتمدة"
                  className={inputCls}
                />
                <span className={hintCls}>النص المصغر داخل الكبسولة الشفافة أعلى العنوان</span>
              </div>

              <div>
                <label htmlFor="st-hero-title" className={labelCls}>العنوان الترحيبي الرئيسي (H1)</label>
                <input
                  id="st-hero-title"
                  type="text"
                  value={form.heroTitle}
                  onChange={(e) => set("heroTitle", e.target.value)}
                  placeholder="حيّا الله في العلا"
                  className={inputCls}
                />
                <span className={hintCls}>العنوان البارز في صدر الموقع (افتراضي: حيّا الله في العلا)</span>
              </div>
            </div>

            <div>
              <label htmlFor="st-hero-subtitle" className={labelCls}>العنوان الفرعي والوصف الترحيبي</label>
              <input
                id="st-hero-subtitle"
                type="text"
                value={form.heroSubtitle}
                onChange={(e) => set("heroSubtitle", e.target.value)}
                placeholder="وين ودّك تقضي إقامتك بين الجبال والواحات؟"
                className={inputCls}
              />
              <span className={hintCls}>الجملة التسويقية أسفل العنوان الترحيبي</span>
            </div>
          </div>

          {/* قسم استكشاف الخريطة ومجموعات الإقامات */}
          <div className="clay p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <Type className="w-5 h-5 text-amber-600" />
              <div>
                <h4 className="font-black text-sm text-neutral-900 dark:text-neutral-100">
                  عناوين أقسام ومجموعات الشقق
                </h4>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  التحكم في عناوين وتفاصيل صفوف العرض المختلفة في الصفحة الرئيسية
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="st-dest-title" className={labelCls}>عنوان استكشاف المناطق والمعالم (الدوائر)</label>
              <input
                id="st-dest-title"
                type="text"
                value={form.destinationsTitle}
                onChange={(e) => set("destinationsTitle", e.target.value)}
                placeholder="في كل زاوية من العلا لك إقامة"
                className={inputCls}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                <span className="text-xs font-black text-[var(--clay-accent)]">الصف الأول (المعالم التراثية)</span>
                <div>
                  <label htmlFor="st-herit-title" className={labelCls}>العنوان</label>
                  <input
                    id="st-herit-title"
                    type="text"
                    value={form.heritageSectionTitle}
                    onChange={(e) => set("heritageSectionTitle", e.target.value)}
                    placeholder="اسكن حول المعالم التراثية (الحِجر ودادان)"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="st-herit-sub" className={labelCls}>الوصف الفرعي</label>
                  <input
                    id="st-herit-sub"
                    type="text"
                    value={form.heritageSectionSubtitle}
                    onChange={(e) => set("heritageSectionSubtitle", e.target.value)}
                    placeholder="شقق وأجنحة في قلب عبق التاريخ والبلدة القديمة"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                <span className="text-xs font-black text-amber-600">الصف الثاني (الإطلالات الجبلية)</span>
                <div>
                  <label htmlFor="st-mount-title" className={labelCls}>العنوان</label>
                  <input
                    id="st-mount-title"
                    type="text"
                    value={form.mountainSectionTitle}
                    onChange={(e) => set("mountainSectionTitle", e.target.value)}
                    placeholder="أجنحة بإطلالات جبلية وصخرة الفيل"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="st-mount-sub" className={labelCls}>الوصف الفرعي</label>
                  <input
                    id="st-mount-sub"
                    type="text"
                    value={form.mountainSectionSubtitle}
                    onChange={(e) => set("mountainSectionSubtitle", e.target.value)}
                    placeholder="إطلالات ساحرة على تشكيلات صخور وجبال العلا الصحراوية"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                <span className="text-xs font-black text-emerald-600">الصف الثالث (واحات النخيل)</span>
                <div>
                  <label htmlFor="st-oasis-title" className={labelCls}>العنوان</label>
                  <input
                    id="st-oasis-title"
                    type="text"
                    value={form.oasisSectionTitle}
                    onChange={(e) => set("oasisSectionTitle", e.target.value)}
                    placeholder="إقامات قلب واحة النخيل والهدوء"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="st-oasis-sub" className={labelCls}>الوصف الفرعي</label>
                  <input
                    id="st-oasis-sub"
                    type="text"
                    value={form.oasisSectionSubtitle}
                    onChange={(e) => set("oasisSectionSubtitle", e.target.value)}
                    placeholder="استوديوهات وشاليهات وسط بساتين النخيل والحمضيات"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                <span className="text-xs font-black text-purple-600">الصف الرابع (الفلل والمزارع الفاخرة)</span>
                <div>
                  <label htmlFor="st-villas-title" className={labelCls}>العنوان</label>
                  <input
                    id="st-villas-title"
                    type="text"
                    value={form.villasSectionTitle}
                    onChange={(e) => set("villasSectionTitle", e.target.value)}
                    placeholder="فلل ملكية ومزارع بمسابح خاصة"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="st-villas-sub" className={labelCls}>الوصف الفرعي</label>
                  <input
                    id="st-villas-sub"
                    type="text"
                    value={form.villasSectionSubtitle}
                    onChange={(e) => set("villasSectionSubtitle", e.target.value)}
                    placeholder="مساحات رحبة وخصوصية تامة للعائلات والمجموعات"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* قسم بنر دعوة المضيفين والتذييل */}
          <div className="clay p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="font-black text-sm text-neutral-900 dark:text-neutral-100">
                  بنر بوابة المضيفين وتذييل الموقع (Footer)
                </h4>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  العبارات الدعائية لاستقطاب أصحاب الشقق ووصف المنصة في الفوتر
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="st-host-badge" className={labelCls}>شارة بنر المضيفين</label>
                <input
                  id="st-host-badge"
                  type="text"
                  value={form.hostBannerBadge}
                  onChange={(e) => set("hostBannerBadge", e.target.value)}
                  placeholder="لأصحاب العقارات والشقق في العلا"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="st-host-title" className={labelCls}>عنوان بنر المضيفين</label>
                <input
                  id="st-host-title"
                  type="text"
                  value={form.hostBannerTitle}
                  onChange={(e) => set("hostBannerTitle", e.target.value)}
                  placeholder="تبي تعرض وحدتك أو عقارك للإيجار؟"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="st-host-sub" className={labelCls}>وصف بنر المضيفين</label>
              <textarea
                id="st-host-sub"
                rows={2}
                value={form.hostBannerSubtitle}
                onChange={(e) => set("hostBannerSubtitle", e.target.value)}
                placeholder="انضم إلى نخبة مضيفي شقق العلا، واستقبل زوار وسياح العلا من كافة أنحاء العالم مع نظام دفع إلكتروني آمن ودعم مستمر."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="st-footer-desc" className={labelCls}>نبذة المنصة في الفوتر (أسفل الموقع)</label>
              <textarea
                id="st-footer-desc"
                rows={2}
                value={form.footerDescription}
                onChange={(e) => set("footerDescription", e.target.value)}
                placeholder="منصة حجز وإدارة شقق وإقامات العلا الأولى. تجربة ضيافة سعودية فريدة بإطلالات ساحرة على التاريخ والطبيعة."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. تبويب الترخيص والاعتماد السياحي ─── */}
      {activeSubTab === "license" && (
        <div className="clay p-5 space-y-4">
          <h4 className="font-extrabold mb-2 flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
            <Shield className="w-4 h-4 text-emerald-600" />
            بيانات الترخيص السياحي للمنصة
          </h4>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            تحكّم في إظهار شارة الاعتماد والترخيص السياحي في الموقع. المنصة غير مرخصة حالياً ولن تظهر الشارة إلا إذا قمت بتفعيل هذا الخيار وإدخال رقم الترخيص هنا.
          </p>

          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/50">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isTourismLicensed}
                onChange={(e) => set("isTourismLicensed", e.target.checked)}
                className="w-4 h-4 rounded text-[var(--clay-accent)] focus:ring-[var(--clay-accent)] accent-[var(--clay-accent)] cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                تفعيل إظهار الشارة والترخيص السياحي في الموقع العام
              </span>
            </label>

            {form.isTourismLicensed && (
              <div className="pt-2 animate-in fade-in duration-200">
                <label htmlFor="st-license" className={labelCls}>
                  رقم ترخيص وزارة السياحة أو السجل التجاري / وثيقة العمل الحر
                </label>
                <input
                  id="st-license"
                  type="text"
                  dir="ltr"
                  value={form.tourismLicenseNumber}
                  onChange={(e) => set("tourismLicenseNumber", e.target.value)}
                  placeholder="مثال: 7310000000 أو 1010XXXXXX"
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 3. تبويب العلامة التجارية والتواصل ─── */}
      {activeSubTab === "general" && (
        <div className="clay p-5 space-y-4">
          <h4 className="font-extrabold mb-2 flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
            <Settings className="w-4 h-4 text-neutral-700" />
            العلامة التجارية وروابط التواصل
          </h4>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="st-brand" className={labelCls}>اسم العلامة التجارية</label>
              <input id="st-brand" type="text" value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="شقق العلا" className={inputCls} />
            </div>
            <div>
              <label htmlFor="st-email" className={labelCls}>البريد الرسمي</label>
              <input id="st-email" type="email" dir="ltr" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="info@alulahome.com" className={inputCls} />
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
        </div>
      )}

      {/* ─── 4. تبويب بوابات الدفع والمزودات ─── */}
      {activeSubTab === "services" && (
        <div className="clay p-5 space-y-4">
          <h4 className="font-extrabold mb-2 flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
            <Building2 className="w-4 h-4 text-neutral-700" />
            بوابات الدفع والخرائط والبريد
          </h4>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="st-payment" className={labelCls}>بوابة الدفع</label>
              <select id="st-payment" value={form.paymentProvider} onChange={(e) => set("paymentProvider", e.target.value)} className={inputCls}>
                <option value="">— غير محدد —</option>
                <option value="tap">Tap Payments (مدى، Apple Pay)</option>
                <option value="moyasar">Moyasar</option>
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

          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 leading-6">
            🔐 <strong>المفاتيح الحقيقية</strong> لا تُخزَّن هنا — أضِفها في
            <a href="https://dashboard.convex.dev" target="_blank" rel="noreferrer" className="underline mx-1">Convex Dashboard</a>
            ← Settings ← Environment Variables (مثل TAP_SECRET_KEY أو STRIPE_SECRET_KEY). هنا تسجّل اسم المزود المفضل فقط.
          </div>
        </div>
      )}

      {/* زر الحفظ الثابت */}
      <div className="sticky bottom-4 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center justify-between">
        <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" />
          يتم تطبيق كافة التعديلات فوراً على الموقع العام بعد الضغط على حفظ.
        </span>

        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={saving}
          className="clay-btn px-6 py-2.5 text-sm font-black disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>حفظ التعديلات</span>
        </button>
      </div>
    </div>
  );
}
