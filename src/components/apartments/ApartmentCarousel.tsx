import { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { ApartmentCard } from "../ApartmentCard";
import type { ApartmentRecord } from "@/types/apartment";

interface ApartmentCarouselProps {
  title: string;
  subtitle?: string;
  apartments: ApartmentRecord[];
  onViewAll?: () => void;
}

export function ApartmentCarousel({
  title,
  subtitle,
  apartments,
  onViewAll,
}: ApartmentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -340 : 340;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!apartments || apartments.length === 0) return null;

  return (
    <section className="mb-12">
      {/* ── Section Header with Title and < > Controls ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-[var(--clay-accent)] hover:underline ml-2 hidden sm:block"
            >
              عرض الكل
            </button>
          )}
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="السابق"
            className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="التالي"
            className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Row of Cards ── */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {apartments.map((apt) => (
          <div
            key={apt._id}
            className="w-[280px] sm:w-[310px] shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <ApartmentCard apartment={apt} />
          </div>
        ))}
      </div>
    </section>
  );
}
