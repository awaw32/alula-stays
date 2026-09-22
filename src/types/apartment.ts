export type ApartmentFormMode = "create" | "edit";

export interface ApartmentRecord {
  _id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  area: number;
  location: string;
  locationAr?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: string[];
  rules?: string[];
  rulesAr?: string[];
  available?: boolean;
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  badges?: string[];
}

export interface ApartmentFormValues {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  area: number;
  location: string;
  locationAr: string;
  latitude: number;
  longitude: number;
  images: string[];
  amenities: string[];
  rules: string[];
  rulesAr: string[];
  available: boolean;
}
