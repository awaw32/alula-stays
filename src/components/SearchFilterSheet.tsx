import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import {
  Search,
  X,
  MapPin,
  ArrowUpDown,
  Bed,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const locations = [
  { value: "all", label: "جميع المناطق" },
  { value: "AlUla Old Town", label: "ديرة العلا القديمة" },
  { value: "Elephant Rock", label: "صخرة الفيل" },
  { value: "Hegra", label: "الحِجر (مدائن صالح)" },
  { value: "Dadan", label: "مملكة دادان" },
  { value: "AlUla Oasis", label: "واحة النخيل" },
  { value: "AlUla Arts District", label: "حي الفنون (الجديدة)" },
  { value: "Jabal Ithlib", label: "جبال شرعان" },
  { value: "Heritage Village", label: "القرية التراثية" },
];

const sortOptions = [
  { value: "recommended", label: "مُوصى بها" },
  { value: "price-low", label: "السعر: من الأقل" },
  { value: "price-high", label: "السعر: من الأعلى" },
  { value: "rating", label: "الأعلى تقييماً" },
];

const bedroomOptions = [
  { value: 0, label: "الكل" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

interface SearchFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchFilterSheet({ isOpen, onClose }: SearchFilterSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedLocation, setSelectedLocation] = useState(
    searchParams.get("location") || "all",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "recommended",
  );
  const [bedrooms, setBedrooms] = useState(
    Number(searchParams.get("bedrooms")) || 0,
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  // Sync from URL when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSearch(searchParams.get("q") || "");
      setSelectedLocation(searchParams.get("location") || "all");
      setSortBy(searchParams.get("sortBy") || "recommended");
      setBedrooms(Number(searchParams.get("bedrooms")) || 0);
      setMinPrice(searchParams.get("minPrice") || "");
      setMaxPrice(searchParams.get("maxPrice") || "");
    }
  }, [isOpen, searchParams]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedLocation !== "all" ||
    sortBy !== "recommended" ||
    bedrooms > 0 ||
    minPrice !== "" ||
    maxPrice !== "";

  const clearAll = () => {
    setSearch("");
    setSelectedLocation("all");
    setSortBy("recommended");
    setBedrooms(0);
    setMinPrice("");
    setMaxPrice("");
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedLocation !== "all") params.set("location", selectedLocation);
    if (sortBy !== "recommended") params.set("sortBy", sortBy);
    if (bedrooms > 0) params.set("bedrooms", String(bedrooms));
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    const target = location.pathname === "/apartments" ? "/apartments" : "/apartments";
    navigate(`${target}${params.toString() ? `?${params.toString()}` : ""}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                البحث والفلاتر
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={1.75} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن شقة أو حي في العلا..."
                  className="w-full h-12 pr-10 pl-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-medium placeholder:text-neutral-400 focus:outline-none focus:border-[var(--clay-accent)] focus:ring-2 focus:ring-[var(--clay-accent)]/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Location Pills */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--clay-accent)]" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    المنطقة
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => setSelectedLocation(loc.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedLocation === loc.value
                          ? "bg-[var(--clay-accent)] text-white shadow-sm"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--clay-accent)]" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    الترتيب
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortBy(opt.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        sortBy === opt.value
                          ? "bg-[var(--clay-accent)] text-white shadow-sm"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Bed className="w-3.5 h-3.5 text-[var(--clay-accent)]" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    عدد الغرف
                  </span>
                </div>
                <div className="flex gap-2">
                  {bedroomOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBedrooms(opt.value)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        bedrooms === opt.value
                          ? "bg-[var(--clay-accent)] text-white shadow-sm"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--clay-accent)]" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    نطاق السعر (ر.س / ليلة)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="من"
                    className="flex-1 h-11 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-center focus:outline-none focus:border-[var(--clay-accent)] transition-colors"
                  />
                  <span className="text-neutral-400 text-xs font-bold">—</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="إلى"
                    className="flex-1 h-11 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-center focus:outline-none focus:border-[var(--clay-accent)] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-4 flex items-center gap-3 bg-white dark:bg-neutral-900">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-4 py-3 rounded-2xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  مسح الكل
                </button>
              )}
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 h-12 rounded-2xl bg-[var(--clay-accent)] hover:opacity-90 text-white text-sm font-bold shadow-lg shadow-[var(--clay-accent)]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                عرض النتائج
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
