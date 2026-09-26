import { ApartmentForm } from "@/components/apartments/ApartmentForm";
import { Navigation } from "@/components/Navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ApartmentFormValues } from "@/types/apartment";
import { useAuth } from "@/hooks/use-auth";
import { DEMO_MODE } from "@/lib/demo-data";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const initialValues: ApartmentFormValues = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  price: 500,
  weekendPrice: 0,
  minNights: 1,
  propertyType: "apartment",
  cleaningFee: 0,
  deposit: 0,
  checkInTime: "15:00",
  checkOutTime: "12:00",
  petsAllowed: false,
  smokingAllowed: false,
  elevator: false,
  wheelchairAccessible: false,
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  area: 50,
  location: "Heritage Village",
  locationAr: "القرية التراثية",
  latitude: 26.62,
  longitude: 37.92,
  images: [],
  amenities: ["wifi", "ac"],
  rules: [],
  rulesAr: [],
  available: true,
};

export default function AddApartment() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const myProfile = useQuery(api.users.myProfile, DEMO_MODE ? "skip" : undefined);
  const createApartment = useMutation(api.admin.createApartment);
  // إذا لم يكن المستخدم مالكاً معتمداً أو مديراً، يتم توجيهه إلى لوحة المالك لتقديم أو متابعة الطلب
  useEffect(() => {
    if (role !== undefined && role !== "owner" && role !== "admin") {
      toast.info("يجب اعتماد حسابك كمالك عقار من الإدارة قبل إضافة الشقق");
      navigate("/owner", { replace: true });
    }
  }, [role, navigate]);

  // إكمال الملف الشخصي قبل إضافة شقة (بعد الـ hooks لضمان ترتيب ثابت)
  if (myProfile !== undefined && !myProfile?.phone) {
    return <Navigate to="/owner/profile" replace />;
  }

  const handleSubmit = async (values: ApartmentFormValues) => {
    await createApartment({
      title: values.title,
      titleAr: values.titleAr || undefined,
      description: values.description,
      descriptionAr: values.descriptionAr || undefined,
      price: values.price,
      weekendPrice: values.weekendPrice > 0 ? values.weekendPrice : undefined,
      minNights: values.minNights > 1 ? values.minNights : undefined,
      propertyType: values.propertyType,
      cleaningFee: values.cleaningFee > 0 ? values.cleaningFee : undefined,
      deposit: values.deposit > 0 ? values.deposit : undefined,
      checkInTime: values.checkInTime || undefined,
      checkOutTime: values.checkOutTime || undefined,
      petsAllowed: values.petsAllowed || undefined,
      smokingAllowed: values.smokingAllowed || undefined,
      elevator: values.elevator || undefined,
      wheelchairAccessible: values.wheelchairAccessible || undefined,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      maxGuests: values.maxGuests,
      area: values.area,
      location: values.location,
      locationAr: values.locationAr || undefined,
      latitude: values.latitude || undefined,
      longitude: values.longitude || undefined,
      images: values.images,
      amenities: values.amenities,
      rules: values.rules,
      rulesAr: values.rulesAr,
    });
    toast.success("تم رفع الشقة — بانتظار مراجعة الإدارة");
    navigate("/owner");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-[var(--foreground)] md:text-3xl">
          <KeyRound className="h-6 w-6 text-[var(--clay-accent)]" />
          إضافة شقة جديدة
        </h1>
        <p className="mb-4 text-[var(--muted-foreground)]">أضف شقتك للاستفادة من منصة شقق العلا</p>
        <div className="mb-8 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            بعد الرفع تصل شقتك إلى إدارة المنصة للمراجعة والتوثيق قبل ظهورها
            للمستأجرين. ستظهر بحالة "بانتظار المراجعة" في لوحة المالك حتى تُعتمد.
          </span>
        </div>
        <ApartmentForm mode="create" initialValues={initialValues} onSubmit={handleSubmit} disabled={upgrading} />
      </main>
    </div>
  );
}
