import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link } from "react-router";
import type { ApartmentRecord } from "@/types/apartment";
import { Heart, Search } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Favorites() {
  const favorites = useQuery(api.favorites.list);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">المفضلة</h1>
          <p className="text-[var(--muted-foreground)]">الشقق التي حفظتها للمشاهدة لاحقاً</p>
        </motion.div>

        {favorites === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="clay animate-pulse">
                <div className="aspect-[4/3] bg-[var(--clay-surface)] rounded-t-[1.5rem]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[var(--clay-surface)] rounded-full w-3/4" />
                  <div className="h-3 bg-[var(--clay-surface)] rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <div className="clay p-12 text-center mt-8">
              <Heart className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
              <h3 className="font-bold text-lg text-[var(--foreground)] mb-2">لا توجد شقق مفضلة</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">ابدأ بتصفح الشقق وأضف المفضلة لديك</p>
              <Link to="/apartments" className="clay-btn text-sm inline-flex items-center gap-2">
                <Search className="w-4 h-4" />تصفح الشقق
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {favorites.map((fav, i) => (
              fav.apartment && (
                <motion.div key={fav._id} variants={fadeUp} custom={i + 1}>
                  <ApartmentCard apartment={fav.apartment as ApartmentRecord} />
                </motion.div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
