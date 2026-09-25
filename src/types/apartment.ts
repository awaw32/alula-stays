export type PropertyType = "apartment" | "chalet" | "villa" | "camp";

export type ApartmentFormMode = "create" | "edit";

export interface ApartmentRecord {
  _id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  weekendPrice?: number;
  minNights?: number;
  propertyType?: PropertyType;
  cleaningFee?: number;
  deposit?: number;
  checkInTime?: string;
  checkOutTime?: string;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  elevator?: boolean;
  wheelchairAccessible?: boolean;
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
  weekendPrice: number;
  minNights: number;
  propertyType: PropertyType;
  cleaningFee: number;
  deposit: number;
  checkInTime: string;
  checkOutTime: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  elevator: boolean;
  wheelchairAccessible: boolean;
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
