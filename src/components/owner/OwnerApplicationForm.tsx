import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import {
  Building2,
  Phone,
  User,
  MapPin,
  Home,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  HelpCircle,
} from "lucide-react";

interface OwnerApplicationFormProps {
  initialName?: string;
  initialPhone?: string;
  onSuccess?: () => void;
}

const PROPERTY_TYPES = [
  "شقق سكنية مفروشة",
  "فلل وبيوت خاصة",
  "شاليهات واستراحات",
  "مزارع ونزل ريفية",
  "أجنحة واستوديوهات فاخرة",
];

export function OwnerApplicationForm({
  initialName = "",
  initialPhone = "",
  onSuccess,
}: OwnerApplicationFormProps) {
  const submitApplication = useMutation(api.owners.submitOwnerApplication);

  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [city, setCity] = useState("العلا");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([PROPERTY_TYPES[0]]);
  const [propertyCount, setPropertyCount] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t)
        ? prev.length > 1
          ? prev.filter((item) => item !== t)
          : prev
        : [...prev, t]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error("يرجى إدخال الاسم الكامل بشكل صحيح");
      return;
    }

    const cleanPhone = phone.trim().replace(/[^\d+]/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error("يرجى إدخال رقم جوال صحيح للتواصل");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitApplication({
        fullName: fullName.trim(),
        phone: cleanPhone,
        city: city.trim() || "العلا",
        propertyTypes: selectedTypes.join("، "),
        propertyCount: Number(propertyCount) || 1,
        notes: notes.trim() || undefined,
      });

      toast.success(
        res.message || "تم رفع بياناتك للإدارة وسيتم قبول حسابك بأقرب وقت"
      );
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "تعذر إرسال طلب الانضمام كمالك"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* رأس الصفحة الترحيبي */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-3 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>انضم لمجتمع مضيفي وملاك شقق العلا</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
          تسجيل وتفعيل حساب مالك عقار
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-xl mx-auto">
          سجّل عقارك وابدأ باستقبال زوار وسياح العلا. ارفع بياناتك وسيتم مراجعتها واعتماد حسابك من الإدارة في أقرب وقت.
        </p>
      </motion.div>

      {/* ميزات المنصة للمالكين (مجموعة في شريط وبطاقة واحدة أنيقة ومضغوطة) */}
      <div className="clay p-4 sm:p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-neutral-200/70 dark:divide-neutral-800">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[var(--foreground)]">حماية ومدفوعات مضمونة</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">تحصيل فوري وتوثيق هويات</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[var(--foreground)]">تحكم كامل بالإتاحة</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">تقويم ذكي وتعديل مرن للأسعار</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[var(--foreground)]">عمولة منافسة وتسويق مباشر</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">وصول لأكبر شريحة من زوار العلا</p>
            </div>
          </div>
        </div>
      </div>

      {/* استمارة بيانات المالك */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay p-6 sm:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          {/* الاسم الكامل */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              <User className="inline-block w-4 h-4 ml-1 text-[var(--clay-accent)]" />
              الاسم الكامل أو اسم المنشأة / المالك *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: عبدالله محمد بن سعود"
              className="clay-input w-full text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* رقم الجوال والمدينة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                <Phone className="inline-block w-4 h-4 ml-1 text-[var(--clay-accent)]" />
                رقم الجوال للتواصل وتنبيهات الحجوزات *
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="clay-input w-full text-sm text-right"
                disabled={isSubmitting}
              />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 block">
                سيستخدم هذا الرقم للتواصل معك بشأن الحجوزات واعتماد الحساب.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                <MapPin className="inline-block w-4 h-4 ml-1 text-[var(--clay-accent)]" />
                المدينة / موقع العقارات *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: العلا - الصخيرات أو الديرة"
                className="clay-input w-full text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* نوع العقارات */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-2">
              <Home className="inline-block w-4 h-4 ml-1 text-[var(--clay-accent)]" />
              أنواع الوحدات العقارية التي ترغب بإضافتها *
            </label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[var(--clay-accent)] text-white shadow-sm"
                        : "bg-[var(--clay-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* عدد الوحدات المتوقعة */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              <Building2 className="inline-block w-4 h-4 ml-1 text-[var(--clay-accent)]" />
              عدد الوحدات أو الشقق المتاحة لديك
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPropertyCount(num)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    propertyCount === num
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-[var(--clay-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {num === 10 ? "+10 وحدات" : `${num} ${num === 1 ? "وحدة" : "وحدات"}`}
                </button>
              ))}
            </div>
          </div>

          {/* نبذة وملاحظات */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              <HelpCircle className="inline-block w-4 h-4 ml-1 text-[var(--clay-accent)]" />
              ملاحظات إضافية أو وصف مختصر للعقار (اختياري)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب نبذة عن شققك، مميزاتها، هل تتوفر على إطلالة جبلية، أوقات الاستقبال..."
              className="clay-input w-full text-sm resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* زر الإرسال */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-btn w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 text-white bg-gradient-to-r from-[var(--clay-accent)] to-amber-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ رفع البيانات للإدارة...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>رفع طلب الانضمام كمالك عقار للإدارة</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[var(--muted-foreground)] mt-3">
              بتقديم الطلب، ستتلقى الإدارة بياناتك وسيتم تفعيل حسابك كمالك خلال وقت وجيز.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
