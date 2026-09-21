import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { useState } from "react";
import {
  Home,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Users,
  Maximize,
  Wifi,
  Car,
  UtensilsCrossed,
  Wind,
  Mountain,
  Waves,
  Loader2,
  ArrowRight,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const availableAmenities = [
  { key: "wifi", label: "واي فاي", icon: Wifi },
  { key: "parking", label: "مواقف سيارات", icon: Car },
  { key: "kitchen", label: "مطبخ مجهز", icon: UtensilsCrossed },
  { key: "ac", label: "تكييف", icon: Wind },
  { key: "mountain_view", label: "إطلالة جبلية", icon: Mountain },
  { key: "pool", label: "مسبح", icon: Waves },
  { key: "washer", label: "غسالة", icon: Home },
  { key: "tv", label: "تلفزيون", icon: Home },
];

const alUlaLocations = [
  "Heritage Village",
  "Jabal Ithlib",
  "AlUla Old Town",
  "Dadan",
  "Elephant Rock",
  "Hegra",
  "AlUla Arts District",
  "AlUla Oasis",
];

export default function AddApartment() {
  const navigate = useNavigate();
  const createApartment = useMutation(api.admin.createApartment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    price: 500,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    area: 50,
    location: "Heritage Village",
    locationAr: "القرية التراثية",
    latitude: 26.62,
    longitude: 37.92,
    imageUrl: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["wifi", "ac"]);

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const addImage = () => {
    if (form.imageUrl.trim() && !images.includes(form.imageUrl.trim())) {
      setImages([...images, form.imageUrl.trim()]);
      setForm((prev) => ({ ...prev, imageUrl: "" }));
    }
  };

  const removeImage = (idx: number) => setImages(images.filter((_, i) => i !== idx));

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || images.length === 0) {
      setError("يرجى ملء جميع الحقول المطلوبة وإضافة صورة واحدة على الأقل");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = await createApartment({
        title: form.title,
        titleAr: form.titleAr || undefined,
        description: form.description,
        descriptionAr: form.descriptionAr || undefined,
        price: form.price,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        maxGuests: form.maxGuests,
        area: form.area,
        location: form.location,
        locationAr: form.locationAr || undefined,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        images,
        amenities: selectedAmenities,
      });
      navigate(`/apartment/${id}`);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إضافة الشقة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">إضافة شقة جديدة</h1>
          <p className="text-[var(--muted-foreground)] mb-8">أضف شقتك ل开始 الاستفادة من منصة شقق العلا</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="clay p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2"><Home className="w-5 h-5" />المعلومات الأساسية</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">اسم الشقة (إنجليزي) *</label>
                  <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} className="clay-input w-full text-sm" placeholder="e.g. Desert Rose Suite" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">اسم الشقة (عربي)</label>
                  <input type="text" value={form.titleAr} onChange={(e) => update("titleAr", e.target.value)} className="clay-input w-full text-sm" placeholder="مثال: ج套房 وردة الصحراء" dir="rtl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">الوصف (إنجليزي) *</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="clay-input w-full text-sm min-h-[120px] resize-none" placeholder="Detailed description of the apartment..." required />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">الوصف (عربي)</label>
                  <textarea value={form.descriptionAr} onChange={(e) => update("descriptionAr", e.target.value)} className="clay-input w-full text-sm min-h-[100px] resize-none" dir="rtl" placeholder="وصف تفصيلي للشقة..." />
                </div>
              </div>
            </div>

            {/* Pricing & Details */}
            <div className="clay p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5" />الأسعار والتفاصيل</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">السعر/ليلة (ر.س) *</label>
                  <input type="number" value={form.price} onChange={(e) => update("price", Number(e.target.value))} className="clay-input w-full text-sm" min={50} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block"><Bed className="w-4 h-4 inline" /> الغرف</label>
                  <input type="number" value={form.bedrooms} onChange={(e) => update("bedrooms", Number(e.target.value))} className="clay-input w-full text-sm" min={1} max={10} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block"><Bath className="w-4 h-4 inline" /> الحمامات</label>
                  <input type="number" value={form.bathrooms} onChange={(e) => update("bathrooms", Number(e.target.value))} className="clay-input w-full text-sm" min={1} max={10} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block"><Users className="w-4 h-4 inline" /> ضيوف</label>
                  <input type="number" value={form.maxGuests} onChange={(e) => update("maxGuests", Number(e.target.value))} className="clay-input w-full text-sm" min={1} max={20} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block"><Maximize className="w-4 h-4 inline" /> المساحة (م²)</label>
                  <input type="number" value={form.area} onChange={(e) => update("area", Number(e.target.value))} className="clay-input w-full text-sm" min={10} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-1 block"><MapPin className="w-4 h-4 inline" /> الموقع</label>
                  <select value={form.location} onChange={(e) => update("location", e.target.value)} className="clay-input w-full text-sm">
                    {alUlaLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="clay p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">الصور *</h2>
              <div className="flex gap-2 mb-4">
                <input type="url" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} className="clay-input flex-1 text-sm" placeholder="الصق رابط صورة هنا..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())} />
                <button type="button" onClick={addImage} className="clay-btn text-sm px-4 flex items-center gap-1"><Plus className="w-4 h-4" />إضافة</button>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-full h-24 object-cover rounded-xl" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="clay p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">المرافق</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableAmenities.map((amenity) => (
                  <button key={amenity.key} type="button" onClick={() => toggleAmenity(amenity.key)} className={`clay-sm px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all ${selectedAmenities.includes(amenity.key) ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"}`}>
                    <amenity.icon className="w-4 h-4" />{amenity.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}

            {/* Submit */}
            <button type="submit" disabled={loading} className="clay-btn w-full text-center text-lg py-3.5 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {loading ? "جاري الإضافة..." : "إضافة الشقة"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
