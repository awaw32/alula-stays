import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/error-message";
import { DEMO_MODE } from "@/lib/demo-data";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import type { ApartmentFormMode, ApartmentFormValues } from "@/types/apartment";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Bath,
  Bed,
  Car,
  DollarSign,
  Home,
  Loader2,
  MapPin,
  Maximize,
  Mountain,
  Plus,
  Upload,
  Users,
  UtensilsCrossed,
  Waves,
  Wind,
  Wifi,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const locations = [
  ["Heritage Village", "القرية التراثية"],
  ["Jabal Ithlib", "جبل عِصر"],
  ["AlUla Old Town", "ديرة العلا القديمة"],
  ["Dadan", "دادان"],
  ["Elephant Rock", "صخرة الفيل"],
  ["Hegra", "الحِجر"],
  ["AlUla Arts District", "حي الفنون"],
  ["AlUla Oasis", "واحة العلا"],
] as const;

const amenities = [
  ["wifi", "واي فاي", Wifi],
  ["parking", "مواقف سيارات", Car],
  ["kitchen", "مطبخ مجهز", UtensilsCrossed],
  ["ac", "تكييف", Wind],
  ["mountain_view", "إطلالة جبلية", Mountain],
  ["pool", "مسبح", Waves],
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

// ━━━ حماية الصور ━━━
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** فحص صارم: النوع الحقيقي عبر البايتات الأولى (Magic Numbers) + النوع المعلن + الحجم */
function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `نوع الملف "${file.name}" غير مدعوم — المسموح: JPG أو PNG أو WebP`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `الصورة "${file.name}" تتجاوز 5MB — اختر صورة أصغر`;
  }
  if (file.size < 1024) {
    return `الملف "${file.name}" صغير جداً ليكون صورة حقيقية`;
  }
  return null;
}

/** قراءة البايتات الأولى للتحقق أن الملف صورة فعلية وليس ملفاً متنكراً */
async function hasValidImageSignature(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const startsWith = (bytes: number[]) => bytes.every((b, i) => header[i] === b);
  // JPEG: FF D8 FF — PNG: 89 50 4E 47 — WebP: RIFF....WEBP
  return (
    startsWith([0xff, 0xd8, 0xff]) ||
    startsWith([0x89, 0x50, 0x4e, 0x47]) ||
    (startsWith([0x52, 0x49, 0x46, 0x46]) && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50)
  );
}

/** ضغط الصورة تلقائياً عبر canvas (أقصى عرض 1920px، جودة 0.82) */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1920;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob && blob.size < file.size ? blob : file), "image/jpeg", 0.82),
  );
}

type ApartmentFormProps = {
  mode: ApartmentFormMode;
  initialValues: ApartmentFormValues;
  loading?: boolean;
  disabled?: boolean;
  onSubmit: (values: ApartmentFormValues) => Promise<void>;
};

export function ApartmentForm({ mode, initialValues, loading = false, disabled = false, onSubmit }: ApartmentFormProps) {
  const [form, setForm] = useState<ApartmentFormValues>(initialValues);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);

  const update = <K extends keyof ApartmentFormValues>(key: K, value: ApartmentFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url || form.images.includes(url)) return;
    update("images", [...form.images, url]);
    setImageUrl("");
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (DEMO_MODE) {
      setError("الوضع التجريبي: ربط Convex لتفعيل رفع الصور.");
      return;
    }
    // حد أقصى لعدد الصور
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setError(`الحد الأقصى ${MAX_IMAGES} صورة — احذف صورة أولاً`);
      return;
    }
    const fileList = Array.from(files).slice(0, remaining);
    if (fileList.length < files.length) {
      setError(`يمكنك إضافة ${remaining} صورة فقط للوصول إلى الحد الأقصى (${MAX_IMAGES})`);
    }

    // فحص كل ملف قبل الرفع
    for (const file of fileList) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      if (!(await hasValidImageSignature(file))) {
        setError(`الملف "${file.name}" ليس صورة حقيقية — تم رفضه`);
        return;
      }
    }

    setUploading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_CONVEX_URL as string;
      const uploaded: string[] = [];
      for (const file of fileList) {
        // ضغط تلقائي قبل الرفع
        const compressed = await compressImage(file);
        const finalFile = compressed instanceof File ? compressed : new File([compressed], file.name.replace(/\.png$/i, ".jpg"), { type: "image/jpeg" });
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": finalFile.type },
          body: finalFile,
        });
        if (!result.ok) {
          throw new Error("فشل رفع الصورة، حاول مرة أخرى");
        }
        const { storageId } = (await result.json()) as { storageId: string };
        uploaded.push(`${baseUrl}/api/storage/${storageId}`);
      }
      update("images", [...form.images, ...uploaded]);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "تعذر رفع الصورة"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || form.images.length === 0) {
      setError("يرجى إدخال اسم الشقة والوصف وإضافة صورة واحدة على الأقل");
      return;
    }
    if (form.price < 50 || form.maxGuests < 1 || form.bedrooms < 1 || form.bathrooms < 1) {
      setError("يرجى التحقق من السعر والتفاصيل الأساسية للشقة");
      return;
    }
    if (form.weekendPrice > 0 && form.weekendPrice < form.price) {
      setError("سعر نهاية الأسبوع يجب أن يكون أعلى من السعر الأساسي أو اتركه فارغاً");
      return;
    }
    if (form.minNights < 1 || form.minNights > 30) {
      setError("الحد الأدنى للليالي يجب أن يكون بين 1 و 30");
      return;
    }

    setError(null);
    try {
      await onSubmit(form);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "حدث خطأ أثناء حفظ الشقة"));
    }
  };

  return (
    <motion.form initial="hidden" animate="visible" variants={fadeUp} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="clay space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]"><Home className="h-5 w-5" aria-hidden="true" />المعلومات الأساسية</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">اسم الشقة (بالإنجليزية) *</Label>
            <Input id="title" value={form.title} onChange={(event) => update("title", event.target.value)} className="clay-input mt-1 w-full" placeholder="Desert Rose Suite" required />
          </div>
          <div>
            <Label htmlFor="titleAr">اسم الشقة (بالعربية)</Label>
            <Input id="titleAr" value={form.titleAr} onChange={(event) => update("titleAr", event.target.value)} className="clay-input mt-1 w-full" placeholder="جناح وردة الصحراء" dir="rtl" />
          </div>
          <div>
            <Label htmlFor="description">الوصف (بالإنجليزية) *</Label>
            <Textarea id="description" value={form.description} onChange={(event) => update("description", event.target.value)} className="clay-input mt-1 min-h-[120px] w-full resize-none" placeholder="Detailed description of the apartment..." required />
          </div>
          <div>
            <Label htmlFor="descriptionAr">الوصف (بالعربية)</Label>
            <Textarea id="descriptionAr" value={form.descriptionAr} onChange={(event) => update("descriptionAr", event.target.value)} className="clay-input mt-1 min-h-[100px] w-full resize-none" placeholder="وصف تفصيلي للشقة..." dir="rtl" />
          </div>
        </div>
      </section>

      <section className="clay space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]"><DollarSign className="h-5 w-5" aria-hidden="true" />الأسعار والتفاصيل</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div><Label htmlFor="price">السعر / ليلة (ر.س) *</Label><Input id="price" type="number" min={50} value={form.price} onChange={(event) => update("price", Number(event.target.value))} className="clay-input mt-1 w-full" required /></div>
          <div><Label htmlFor="weekendPrice">سعر ليلة نهاية الأسبوع (ر.س)</Label><Input id="weekendPrice" type="number" min={0} value={form.weekendPrice || ""} onChange={(event) => update("weekendPrice", Number(event.target.value) || 0)} placeholder={`افتراضي: ${form.price}`} className="clay-input mt-1 w-full" /><p className="text-[10px] text-[var(--muted-foreground)] mt-1">الخميس والجمعة — اتركه فارغاً لاستخدام السعر الأساسي</p></div>
          <div><Label htmlFor="minNights">الحد الأدنى للليالي</Label><Input id="minNights" type="number" min={1} max={30} value={form.minNights || 1} onChange={(event) => update("minNights", Number(event.target.value) || 1)} className="clay-input mt-1 w-full" /></div>
          <div><Label htmlFor="cleaningFee">رسوم التنظيف (ر.س)</Label><Input id="cleaningFee" type="number" min={0} value={form.cleaningFee || ""} onChange={(event) => update("cleaningFee", Number(event.target.value) || 0)} placeholder="0" className="clay-input mt-1 w-full" /></div>
          <div><Label htmlFor="deposit">مبلغ التأمين (ر.س)</Label><Input id="deposit" type="number" min={0} value={form.deposit || ""} onChange={(event) => update("deposit", Number(event.target.value) || 0)} placeholder="مسترد بعد المغادرة" className="clay-input mt-1 w-full" /></div>
          <div><Label htmlFor="checkInTime">وقت تسجيل الدخول</Label><Input id="checkInTime" type="time" value={form.checkInTime || "15:00"} onChange={(event) => update("checkInTime", event.target.value)} className="clay-input mt-1 w-full" /></div>
          <div><Label htmlFor="checkOutTime">وقت تسجيل الخروج</Label><Input id="checkOutTime" type="time" value={form.checkOutTime || "12:00"} onChange={(event) => update("checkOutTime", event.target.value)} className="clay-input mt-1 w-full" /></div>
          <div>
            <Label htmlFor="propertyType">نوع العقار</Label>
            <select
              id="propertyType"
              value={form.propertyType || "apartment"}
              onChange={(event) => update("propertyType", event.target.value as ApartmentFormValues["propertyType"])}
              className="clay-input mt-1 w-full"
            >
              <option value="apartment">شقة</option>
              <option value="chalet">شاليه</option>
              <option value="villa">فيلا</option>
              <option value="camp">مخيم</option>
            </select>
          </div>
        </div>

        {/* القوانين */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ["petsAllowed", "يسمح بالحيوانات الأليفة"],
            ["smokingAllowed", "يسمح بالتدخين"],
            ["elevator", "يوجد مصعد"],
            ["wheelchairAccessible", "وصول لذوي الإعاقة"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer clay-sm px-3 py-2.5 text-sm select-none">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(event) => update(key, event.target.checked)}
                className="w-4 h-4 accent-[var(--clay-accent)]"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="clay space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]"><Home className="h-5 w-5" aria-hidden="true" />التفاصيل الأساسية</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div><Label htmlFor="bedrooms"><Bed className="ml-1 inline h-4 w-4" aria-hidden="true" />الغرف</Label><Input id="bedrooms" type="number" min={1} max={10} value={form.bedrooms} onChange={(event) => update("bedrooms", Number(event.target.value))} className="clay-input mt-1 w-full" /></div>
          <div><Label htmlFor="bathrooms"><Bath className="ml-1 inline h-4 w-4" aria-hidden="true" />الحمامات</Label><Input id="bathrooms" type="number" min={1} max={10} value={form.bathrooms} onChange={(event) => update("bathrooms", Number(event.target.value))} className="clay-input mt-1 w-full" /></div>
          <div><Label htmlFor="maxGuests"><Users className="ml-1 inline h-4 w-4" aria-hidden="true" />الضيوف</Label><Input id="maxGuests" type="number" min={1} max={20} value={form.maxGuests} onChange={(event) => update("maxGuests", Number(event.target.value))} className="clay-input mt-1 w-full" /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label htmlFor="area"><Maximize className="ml-1 inline h-4 w-4" aria-hidden="true" />المساحة (م²)</Label><Input id="area" type="number" min={10} value={form.area} onChange={(event) => update("area", Number(event.target.value))} className="clay-input mt-1 w-full" /></div>
          <div><Label htmlFor="location"><MapPin className="ml-1 inline h-4 w-4" aria-hidden="true" />الموقع</Label><select id="location" value={form.location} onChange={(event) => update("location", event.target.value)} className="clay-input mt-1 w-full" aria-label="موقع الشقة">{locations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        </div>
      </section>

      <section className="clay space-y-4 p-6">
        <h2 className="text-lg font-bold text-[var(--foreground)]">الصور *</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="clay-btn w-full"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            {uploading ? "جاري رفع الصور..." : "رفع الصور من جهازك"}
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">أو الصق رابط صورة</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className="clay-input flex-1" placeholder="الصق رابط صورة هنا..." type="url" aria-label="رابط صورة جديدة" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addImage(); } }} />
          <Button type="button" onClick={addImage} className="clay-btn" aria-label="إضافة صورة بالرابط"><Plus className="h-4 w-4" aria-hidden="true" />إضافة</Button>
        </div>
        {form.images.length > 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{form.images.map((image, index) => <div key={`${image}-${index}`} className="group relative"><img src={image} alt={`صورة الشقة ${index + 1}`} className="h-24 w-full rounded-xl object-cover" /><Button type="button" variant="destructive" size="icon-sm" className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" onClick={() => update("images", form.images.filter((_, imageIndex) => imageIndex !== index))} aria-label={`حذف صورة الشقة ${index + 1}`}><X className="h-3 w-3" aria-hidden="true" /></Button></div>)}</div>}
      </section>

      <section className="clay space-y-4 p-6">
        <h2 className="text-lg font-bold text-[var(--foreground)]">المرافق</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{amenities.map(([key, label, Icon]) => { const selected = form.amenities.includes(key); return <Button key={key} type="button" variant={selected ? "default" : "outline"} onClick={() => update("amenities", selected ? form.amenities.filter((item) => item !== key) : [...form.amenities, key])} className={selected ? "!bg-[var(--clay-accent)] !text-white" : "clay-sm justify-start"} aria-pressed={selected}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Button>; })}</div>
      </section>

      {error && <p className="flex items-center gap-2 text-sm text-red-600" role="alert" aria-live="assertive"><AlertCircle className="h-4 w-4" aria-hidden="true" />{error}</p>}

      <Button type="submit" disabled={loading || disabled} className="clay-btn w-full py-3.5 text-lg">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
        {loading ? "جاري الحفظ..." : mode === "create" ? "إضافة الشقة" : "حفظ التغييرات"}
      </Button>
    </motion.form>
  );
}
