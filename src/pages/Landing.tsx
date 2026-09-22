import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link } from "react-router";
import type { ApartmentRecord } from "@/types/apartment";
import {
  Search,
  MapPin,
  Shield,
  Star,
  Clock,
  Headphones,
  ChevronLeft,
  Mountain,
  Compass,
  Tent,
  Sunrise,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Shield,
    title: "شقق موثقة",
    desc: "كل شقة موثقة ومحقق هويتها لضمان تجربة آمنة وموثوقة",
  },
  {
    icon: Star,
    title: "تقييمات حقيقية",
    desc: "آراء ومراجعات حقيقية من ضيوف سابقين لمساعدتك في الاختيار",
  },
  {
    icon: Clock,
    title: "حجز فوري",
    desc: "تأكيد الحجز فوراً مع إمكانية الدفع الإلكتروني بأمان",
  },
  {
    icon: Headphones,
    title: "دعم مستمر",
    desc: "فريق دعم متواصل على مدار الساعة لمساعدتك في أي وقت",
  },
];

const alUlaHighlights = [
  {
    icon: Mountain,
    title: "جبال رملية",
    desc: "استكشف التشكيلات الصخرية المذهلة والجبال الرملية",
    color: "from-[#C2694F] to-[#A0522D]",
  },
  {
    icon: Compass,
    title: "مواقع تراثية",
    desc: "استكشف الحِجر ودادان والمواقع الأثرية العالمية",
    color: "from-[#D4A574] to-[#B8860B]",
  },
  {
    icon: Tent,
    title: "تجارب فريدة",
    desc: "تجربة الإقامة في قلب الطبيعة الصحراوية الخلابة",
    color: "from-[#8B6F5E] to-[#6B4F3E]",
  },
  {
    icon: Sunrise,
    title: "غروب ساحر",
    desc: "شاهد أجمل غروب شمس في العالم من شقتك",
    color: "from-[#E8956F] to-[#C2694F]",
  },
];

export default function Landing() {
  const featuredApartments = useQuery(api.apartments.featured);
  const stats = useQuery(api.apartments.stats);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[var(--clay-accent)]/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[var(--clay-gold)]/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-16 md:pb-24">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 clay-sm px-4 py-2 text-sm font-medium text-[var(--clay-accent)] bg-[var(--clay-accent-soft)]">
                <MapPin className="w-4 h-4" />
                العلا، المملكة العربية السعودية
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-[var(--foreground)] mb-6"
            >
              اكتشف جمال{" "}
              <span className="bg-gradient-to-r from-[var(--clay-accent)] via-[var(--clay-gold)] to-[var(--clay-accent)] bg-clip-text text-transparent">
                العلا
              </span>
              <br />
              في أرقى الشقق
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              شقق فاخرة بإطلالات خلابة على الجبال الصحراوية.
              <br className="hidden md:block" />
              تجربة إقامة لا تُنسى في أقدم منطقة أثرية في العالم
            </motion.p>

            {/* Search Bar */}
            <motion.div variants={fadeUp} custom={3}>
              <Link
                to="/apartments"
                className="clay inline-flex items-center gap-3 px-6 py-4 md:px-8 md:py-5 w-full max-w-2xl hover:-translate-y-0.5 transition-all group"
              >
                <Search className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-[var(--clay-accent)] transition-colors" />
                <div className="flex-1 text-right">
                  <span className="text-[var(--muted-foreground)] text-sm md:text-base">
                    ابحث عن شقة مثالية في العلا...
                  </span>
                </div>
                <div className="clay-btn text-sm py-2 px-4 md:py-2.5 md:px-6">
                  ابحث
                </div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex items-center justify-center gap-6 md:gap-12 mt-10"
            >
              {[
                {
                  value: `${stats?.total || 0}+`,
                  label: "شقة متاحة",
                },
                {
                  value: `${stats?.avgRating || 4.8}`,
                  label: "متوسط التقييم",
                },
                {
                  value: "٢٤/٧",
                  label: "دعم متواصل",
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--clay-accent)]">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-[var(--muted-foreground)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Featured Apartments ─── */}
      {featuredApartments && featuredApartments.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
                شقق مميزة في العلا
              </h2>
              <p className="text-[var(--muted-foreground)] mt-2">
                أعلى تقييمات وأكثر الشقق طلباً من ضيوفنا
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredApartments.map((apt, i) => (
                <motion.div key={apt._id} variants={fadeUp} custom={i + 1}>
                  <ApartmentCard apartment={apt as ApartmentRecord} />
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} custom={5} className="text-center mt-10">
              <Link
                to="/apartments"
                className="clay-btn-outline inline-flex items-center gap-2 text-sm"
              >
                عرض جميع الشقق
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ─── AlUla Highlights ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              لماذا العلا؟
            </h2>
            <p className="text-[var(--muted-foreground)] mt-2 max-w-lg mx-auto">
              واحدة من أجمل الوجهات السياحية في العالم، حيث يلتقي التاريخ بالطبيعة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {alUlaHighlights.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i + 1}>
                <div className="clay p-6 text-center h-full group hover:-translate-y-1 transition-all">
                  <div
                    className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
                  >
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-[var(--foreground)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              لماذا تختار شقق العلا؟
            </h2>
            <p className="text-[var(--muted-foreground)] mt-2">
              نقدم لك تجربة حجز مريحة وآمنة مع أفضل الشقق في المنطقة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i + 1}>
                <div className="clay p-6 h-full group hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--clay-accent-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--clay-accent)] group-hover:text-white transition-colors">
                    <feature.icon className="w-6 h-6 text-[var(--clay-accent)] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-[var(--foreground)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <div className="clay overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--clay-accent)] via-[#A0522D] to-[var(--clay-gold)] opacity-90" />
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                احجز شقتك في العلا الآن
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8 text-lg leading-relaxed">
                لا تفوت فرصة العيش في أجمل مناطق العالم.
                اختر شقتك واستمتع بتجربة لا تُنسى
              </p>
              <Link
                to="/apartments"
                className="inline-flex items-center gap-2 bg-white text-[var(--clay-accent)] font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/90 transition-colors shadow-xl hover:shadow-2xl"
              >
                <Search className="w-5 h-5" />
                ابدأ البحث الآن
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">عُ</span>
                </div>
                <div>
                  <span className="font-bold text-lg text-[var(--foreground)]">
                    شقق العلا
                  </span>
                  <span className="block text-[10px] text-[var(--muted-foreground)] -mt-1">
                    ALULA APARTMENTS
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                منصة حجز الشقق الأولى في العلا. شقق فاخرة بإطلالات خلابة في أقدم منطقة أثرية في العالم.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--foreground)] mb-4">روابط سريعة</h4>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/apartments", label: "تصفح الشقق" },
                  { href: "/", label: "الرئيسية" },
                  { href: "/auth", label: "تسجيل الدخول" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--clay-accent)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[var(--foreground)] mb-4">تواصل معنا</h4>
              <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
                <span>📍 العلا، المملكة العربية السعودية</span>
                <span>📧 info@alula-apartments.com</span>
                <span>📱 +966 50 123 4567</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
            © 2024 شقق العلا. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
