import { ApartmentForm } from "@/components/apartments/ApartmentForm";
import { Navigation } from "@/components/Navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ApartmentFormValues } from "@/types/apartment";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const initialValues: ApartmentFormValues = {
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
  images: [],
  amenities: ["wifi", "ac"],
  rules: [],
  rulesAr: [],
  available: true,
};

export default function AddApartment() {
  const navigate = useNavigate();
  const createApartment = useMutation(api.admin.createApartment);

  const handleSubmit = async (values: ApartmentFormValues) => {
    const id = await createApartment({
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
    });
    toast.success("تمت إضافة الشقة بنجاح");
    navigate(`/apartment/${id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)] md:text-3xl">إضافة شقة جديدة</h1>
        <p className="mb-8 text-[var(--muted-foreground)]">أضف شقتك للاستفادة من منصة شقق العلا</p>
        <ApartmentForm mode="create" initialValues={initialValues} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
