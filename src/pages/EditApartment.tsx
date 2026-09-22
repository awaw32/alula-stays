import { Navigation } from "@/components/Navigation";
import { ApartmentForm } from "@/components/apartments/ApartmentForm";
import { useAuth } from "@/hooks/use-auth";
import type { ApartmentFormValues, ApartmentRecord } from "@/types/apartment";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

function toFormValues(apartment: ApartmentRecord): ApartmentFormValues {
  return {
    title: apartment.title,
    titleAr: apartment.titleAr || "",
    description: apartment.description,
    descriptionAr: apartment.descriptionAr || "",
    price: apartment.price,
    bedrooms: apartment.bedrooms,
    bathrooms: apartment.bathrooms,
    maxGuests: apartment.maxGuests,
    area: apartment.area,
    location: apartment.location,
    locationAr: apartment.locationAr || "",
    latitude: apartment.latitude || 0,
    longitude: apartment.longitude || 0,
    images: apartment.images,
    amenities: apartment.amenities,
    rules: apartment.rules || [],
    rulesAr: apartment.rulesAr || [],
    available: apartment.available !== false,
  };
}

export default function EditApartment() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();
  const apartments = useQuery(api.admin.ownerApartments);
  const updateApartment = useMutation(api.admin.updateApartment);
  const apartment = apartments?.find((item) => item._id === id);

  if (apartments === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--background)]"><Loader2 className="h-6 w-6 animate-spin text-[var(--clay-accent)]" aria-label="جاري تحميل الشقة" /></div>;
  }

  if (!apartment || !id || (role !== "owner" && role !== "admin")) {
    return <div className="min-h-screen bg-[var(--background)]"><Navigation /><main className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">الشقة غير موجودة</h1><Link to="/owner" className="clay-btn mt-6 inline-flex">العودة إلى لوحة المالك</Link></main></div>;
  }

  const handleSubmit = async (values: ApartmentFormValues) => {
    await updateApartment({
      apartmentId: id as Id<"apartments">,
      title: values.title,
      titleAr: values.titleAr || undefined,
      description: values.description,
      descriptionAr: values.descriptionAr || undefined,
      price: values.price,
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
      available: values.available,
    });
    toast.success("تم حفظ التغييرات بنجاح");
    navigate(`/apartment/${id}`);
  };

  return <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0"><Navigation /><main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6"><h1 className="mb-2 text-2xl font-bold text-[var(--foreground)] md:text-3xl">تعديل الشقة</h1><p className="mb-8 text-[var(--muted-foreground)]">حدّث معلومات شقتك ثم احفظ التغييرات</p><ApartmentForm mode="edit" initialValues={toFormValues(apartment)} onSubmit={handleSubmit} /></main></div>;
}
