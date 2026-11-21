import { motion } from "framer-motion";
import { useSeo } from "@/lib/seo";
import { Link } from "react-router";
import { Home, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function NotFound() {
  useSeo({
    title: "الصفحة غير موجودة | شقق العلا",
    description: "عذرًا، الصفحة التي تبحث عنها غير موجودة في منصة شقق العلا.",
    noIndex: true,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-[#15100C] text-[var(--foreground)]">
      <Navigation />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="clay p-8 sm:p-12 max-w-md w-full mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[var(--clay-accent)]/10 text-[var(--clay-accent)] flex items-center justify-center mx-auto text-2xl font-black">
            404
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            الصفحة غير موجودة
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            عذراً، الصفحة التي تبحث عنها قد تم نقلها أو غير متوفرة. يمكنك العودة للصفحة الرئيسية واستكشاف شقق وإقامات العلا.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[var(--clay-accent)] hover:opacity-90 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
