import { cn } from "@/lib/utils";
import { getAmenityLabel, getApartmentLocation, getApartmentTitle } from "@/lib/apartment-content";
import {
  Bed,
  Bath,
  Users,
  Star,
  MapPin,
  CheckCircle,
  Heart,
  ShieldCheck,
  type LucideIcon,
  Wifi,
  Car,
  UtensilsCrossed,
  Wind,
  Mountain,
  Waves,
  Tv,
  Coffee,
  Flame,
  TreePalm,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { ApartmentRecord } from "@/types/apartment";

const amenityIconMap: Record<string, LucideIcon> = {
  wifi: Wifi,
  parking: Car,
  kitchen: UtensilsCrossed,
  ac: Wind,
  mountain_view: Mountain,
  pool: Waves,
  tv: Tv,
  coffee_maker: Coffee,
  bbq: Flame,
  terrace: TreePalm,
  garden: TreePalm,
};

interface ApartmentCardProps {
  apartment: ApartmentRecord;
  className?: string;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  isFavorited?: boolean;
}

export function ApartmentCard({
  apartment,
  className,
  onFavoriteToggle,
  isFavorited = false,
}: ApartmentCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [fav, setFav] = useState(isFavorited);
  const navigate = useNavigate();

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFav(!fav);
    onFavoriteToggle?.(e);
  };

  return (
    <div
      onClick={() => navigate(`/apartment/${apartment._id}`)}
      className={cn(
        "group cursor-pointer flex flex-col bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 select-none",
        className,
      )}
    >
      {/* ── Image & Badges ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={apartment.images[0]}
          alt={apartment.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--clay-accent)] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Favorite Heart in round frosted circle (Gathern style) */}
        <button
          type="button"
          onClick={handleFav}
          aria-label="إضافة للمفضلة"
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-90 z-10"
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              fav ? "fill-rose-500 text-rose-500" : "text-neutral-700 dark:text-neutral-200",
            )}
          />
        </button>

        {/* Tourism License & Verified Badges (Top Right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
          {apartment.tourismLicenseNumber && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700/95 text-white shadow-md backdrop-blur-md">
              <ShieldCheck className="w-3 h-3" />
              مرخص
            </span>
          )}
          {apartment.isFeatured && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--clay-accent)] text-white shadow-md">
              مميز
            </span>
          )}
        </div>

        {/* Price tag on bottom right or left with clean styling */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white flex items-baseline gap-1 text-xs">
            <span className="font-extrabold text-sm">{apartment.price.toLocaleString("ar-SA")}</span>
            <span className="text-[10px] font-medium text-neutral-200">ر.س / ليلة</span>
          </div>
        </div>
      </div>

      {/* ── Content (Gathern Style Layout) ── */}
      <div className="p-3.5 flex flex-col flex-1 text-right">
        {/* Rating Line */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 text-xs font-bold text-neutral-800 dark:text-neutral-100">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span>{apartment.rating}</span>
            <span className="text-[11px] text-neutral-400 font-normal">
              ({apartment.reviewCount} تقييم)
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <CheckCircle className="w-3 h-3" /> حجز فوري
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm leading-snug text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-[var(--clay-accent)] transition-colors mb-1">
          {getApartmentTitle(apartment)}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 mb-2.5 truncate">
          <MapPin className="w-3 h-3 text-[var(--clay-accent)] shrink-0" />
          <span className="truncate">{getApartmentLocation(apartment)}</span>
        </div>

        {/* Specs / Amenities pills */}
        <div className="mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-0.5">
              <Bed className="w-3 h-3 text-[var(--clay-gold)]" />
              {apartment.bedrooms} غرف
            </span>
            <span className="flex items-center gap-0.5">
              <Bath className="w-3 h-3 text-[var(--clay-gold)]" />
              {apartment.bathrooms} حمام
            </span>
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3 text-[var(--clay-gold)]" />
              {apartment.maxGuests} ضيوف
            </span>
          </div>

          <div className="flex items-center gap-1">
            {apartment.amenities.slice(0, 2).map((a) => {
              const Icon = amenityIconMap[a];
              if (!Icon) return null;
              return <Icon key={a} className="w-3 h-3 text-neutral-400" title={getAmenityLabel(a)} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
