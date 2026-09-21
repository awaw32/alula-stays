import { ClayCard } from "./ClayCard";
import { cn } from "@/lib/utils";
import {
  Bed,
  Bath,
  Users,
  Star,
  MapPin,
  CheckCircle,
  Trophy,
  Heart,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

interface Apartment {
  _id: string;
  title: string;
  titleAr?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  area: number;
  location: string;
  locationAr?: string;
  images: string[];
  amenities: string[];
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  badges?: string[];
}

const amenityIcons: Record<string, string> = {
  wifi: "📶",
  parking: "🅿️",
  kitchen: "🍳",
  ac: "❄️",
  mountain_view: "🏔️",
  pool: "🏊",
  washer: "🧺",
  tv: "📺",
  bbq: "🔥",
  gym: "💪",
  terrace: "🌅",
  garden: "🌿",
  coffee_maker: "☕",
  cinema: "🎬",
  firepit: "🔥",
  stargazing: "🔭",
  majlis: "🕌",
};

const badgeConfig: Record<string, { label: string; labelAr: string; icon: typeof Trophy; color: string }> = {
  top_rated: {
    label: "Top Rated",
    labelAr: "الأعلى تقييماً",
    icon: Trophy,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  verified: {
    label: "Verified",
    labelAr: "موثقة",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  premium: {
    label: "Premium",
    labelAr: "مميزة",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  guest_favorite: {
    label: "Guest Favorite",
    labelAr: "مفضلة الضيوف",
    icon: Heart,
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
  new: {
    label: "New",
    labelAr: "جديدة",
    icon: Sparkles,
    color: "bg-sky-100 text-sky-700 border-sky-200",
  },
};

interface ApartmentCardProps {
  apartment: Apartment;
}

export function ApartmentCard({ apartment }: ApartmentCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const navigate = useNavigate();

  const displayBadges = (apartment.badges || [])
    .slice(0, 2)
    .map((b) => badgeConfig[b])
    .filter(Boolean);

  return (
    <ClayCard
      className="overflow-hidden group"
      onClick={() => navigate(`/apartment/${apartment._id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[1.5rem] bg-[var(--clay-surface)]">
        <img
          src={apartment.images[0]}
          alt={apartment.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-3 border-[var(--clay-accent)] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Badges */}
        {displayBadges.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-2">
            {displayBadges.map((badge, i) => (
              <span
                key={i}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm",
                  badge.color,
                )}
              >
                <badge.icon className="w-3 h-3" />
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-3 right-3">
          <div className="clay-sm px-3 py-1.5 bg-white/90 backdrop-blur-sm">
            <span className="text-lg font-bold text-[var(--clay-accent)]">
              {apartment.price.toLocaleString()} ر.س
            </span>
            <span className="text-xs text-[var(--muted-foreground)] block -mt-0.5">
              / ليلة
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-base leading-tight text-[var(--foreground)] line-clamp-1">
            {apartment.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">{apartment.rating}</span>
            <span className="text-xs text-[var(--muted-foreground)]">
              ({apartment.reviewCount})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{apartment.location}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {apartment.bedrooms} غرفة
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {apartment.bathrooms} حمام
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {apartment.maxGuests} ضيف
          </span>
        </div>

        {/* Amenity pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {apartment.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--clay-surface)] text-[var(--muted-foreground)]"
            >
              <span>{amenityIcons[amenity] || "✨"}</span>
              {amenity.replace(/_/g, " ")}
            </span>
          ))}
          {apartment.amenities.length > 4 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--clay-accent-soft)] text-[var(--clay-accent)]">
              +{apartment.amenities.length - 4}
            </span>
          )}
        </div>
      </div>
    </ClayCard>
  );
}
