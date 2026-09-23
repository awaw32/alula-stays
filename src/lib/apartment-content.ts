type ApartmentContent = {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  location: string;
  locationAr?: string;
  rules?: string[];
  rulesAr?: string[];
};

export function getApartmentTitle(apartment: ApartmentContent) {
  return apartment.titleAr?.trim() || apartment.title;
}

export function getApartmentDescription(apartment: ApartmentContent) {
  return apartment.descriptionAr?.trim() || apartment.description;
}

export function getApartmentLocation(apartment: ApartmentContent) {
  return apartment.locationAr?.trim() || apartment.location;
}

export function getApartmentRules(apartment: ApartmentContent) {
  return apartment.rulesAr?.length ? apartment.rulesAr : apartment.rules || [];
}

export function formatSar(amount: number) {
  return `${amount.toLocaleString("ar-SA")} ر.س`;
}

export function formatArabicDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const amenityLabels: Record<string, string> = {
  wifi: "واي فاي",
  parking: "مواقف سيارات",
  kitchen: "مطبخ مجهز",
  ac: "تكييف",
  mountain_view: "إطلالة جبلية",
  pool: "مسبح",
  washer: "غسالة",
  tv: "تلفزيون",
  bbq: "شواء",
  gym: "صالة رياضية",
  terrace: "شرفة",
  garden: "حديقة",
  coffee_maker: "آلة قهوة",
  cinema: "سينما",
  firepit: "مدفأة",
  stargazing: "مراقبة النجوم",
  majlis: "مجلس",
};

export function getAmenityLabel(amenity: string) {
  return amenityLabels[amenity] || amenity.replace(/_/g, " ");
}
