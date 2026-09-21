import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Bed,
  ArrowUpDown,
  X,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const },
  }),
};

const locations = [
  { value: "all", label: "جميع المناطق" },
  { value: "Heritage Village", label: "القرية التراثية" },
  { value: "Jabal Ithlib", label: "جبل عِصر" },
  { value: "AlUla Old Town", label: "ديرة العلا القديمة" },
  { value: "Dadan", label: "دادان" },
  { value: "Elephant Rock", label: "صخرة الفيل" },
  { value: "Hegra", label: "الحِجر" },
  { value: "AlUla Arts District", label: "حي الفنون" },
  { value: "AlUla Oasis", label: "واحة العلا" },
];

const sortOptions = [
  { value: "recommended", label: "مُوصى بها" },
  { value: "price-low", label: "السعر: من الأقل" },
  { value: "price-high", label: "السعر: من الأعلى" },
  { value: "rating", label: "الأعلى تقييماً" },
  { value: "newest", label: "الأحدث" },
];

const bedroomOptions = [
  { value: 0, label: "الكل" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

export default function Apartments() {
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [bedrooms, setBedrooms] = useState(0);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);

  const apartments = useQuery(api.apartments.list, {
    location: selectedLocation === "all" ? undefined : selectedLocation,
    bedrooms: bedrooms > 0 ? bedrooms : undefined,
    minPrice: minPrice !== "" ? minPrice : undefined,
    maxPrice: maxPrice !== "" ? maxPrice : undefined,
    sortBy: sortBy === "recommended" ? undefined : sortBy,
  });

  const filteredApartments = useMemo(() => {
    if (!apartments) return [];
    if (!search.trim()) return apartments;
    const q = search.toLowerCase();
    return apartments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [apartments, search]);

  const activeFilters =
    (selectedLocation !== "all" ? 1 : 0) +
    (bedrooms > 0 ? 1 : 0) +
    (minPrice !== "" ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0);

  const clearFilters = () => {
    setSelectedLocation("all");
    setBedrooms(0);
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
            شقق العلا
          </h1>
          <p className="text-[var(--muted-foreground)]">
            اختر شقتك المثالية من بين أفضل الشقق في العلا
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Search & Filter Bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="mb-6"
        >
          <div className="clay p-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن شقة..."
                  className="clay-input w-full pl-10 text-sm"
                />
              </div>

              {/* Location Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="clay-input pl-10 pr-8 text-sm appearance-none min-w-[180px] cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="clay-input pl-10 pr-8 text-sm appearance-none min-w-[160px] cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`clay-btn-outline text-sm flex items-center gap-2 relative ${
                  activeFilters > 0 ? "!border-[var(--clay-accent)] !text-[var(--clay-accent)]" : ""
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                فلاتر
                {activeFilters > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--clay-accent)] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-[var(--border)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Bedrooms */}
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                      <Bed className="w-4 h-4 inline ml-1" />
                      عدد الغرف
                    </label>
                    <div className="flex gap-2">
                      {bedroomOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setBedrooms(opt.value)}
                          className={`clay-sm px-4 py-2 text-sm font-medium transition-all ${
                            bedrooms === opt.value
                              ? "!bg-[var(--clay-accent)] !text-white"
                              : "text-[var(--muted-foreground)] hover:bg-[var(--clay-surface)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                      نطاق السعر (ر.س / ليلة)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(e.target.value ? Number(e.target.value) : "")
                        }
                        placeholder="من"
                        className="clay-input text-sm flex-1"
                      />
                      <span className="text-[var(--muted-foreground)]">-</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) =>
                          setMaxPrice(e.target.value ? Number(e.target.value) : "")
                        }
                        placeholder="إلى"
                        className="clay-input text-sm flex-1"
                      />
                    </div>
                  </div>

                  {/* Clear */}
                  <div className="flex items-end">
                    {activeFilters > 0 && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-sm text-[var(--clay-accent)] hover:underline"
                      >
                        <X className="w-4 h-4" />
                        مسح الفلاتر
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            {apartments === undefined
              ? "جاري التحميل..."
              : `${filteredApartments.length} شقة متاحة`}
          </p>
        </div>

        {/* Apartment Grid */}
        {apartments === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="clay animate-pulse">
                <div className="aspect-[4/3] bg-[var(--clay-surface)] rounded-t-[1.5rem]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[var(--clay-surface)] rounded-full w-3/4" />
                  <div className="h-3 bg-[var(--clay-surface)] rounded-full w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-3 bg-[var(--clay-surface)] rounded-full w-16" />
                    <div className="h-3 bg-[var(--clay-surface)] rounded-full w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredApartments.length === 0 ? (
          <div className="clay p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
            <h3 className="font-bold text-lg text-[var(--foreground)] mb-2">
              لا توجد نتائج
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              حاول تعديل معايير البحث للحصول على نتائج أفضل
            </p>
            <button onClick={clearFilters} className="clay-btn text-sm">
              مسح الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApartments.map((apt, i) => (
              <motion.div key={apt._id} variants={fadeUp} custom={i + 2}>
                <ApartmentCard apartment={apt as any} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
