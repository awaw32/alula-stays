import { useAuth } from "@/hooks/use-auth";
import { isAuthorizedAdmin } from "@/types/auth";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";
import {
  Calendar,
  Heart,
  Home,
  Menu,
  MessageSquare,
  Search,
  User,
  X,
  Building2,
  TreePalm,
  Tent,
  Sparkles,
  Hotel,
  Globe,
  RotateCcw,
  ShieldCheck,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { NotificationBell } from "./NotificationBell";
import { SearchFilterSheet } from "./SearchFilterSheet";

const navLinks = [
  { href: "/", label: "الرئيسية", icon: Home, requiresAuth: false },
  { href: "/apartments", label: "الشقق والإقامات", icon: Search, requiresAuth: false },
  { href: "/favorites", label: "المفضلة", icon: Heart, requiresAuth: true },
  { href: "/my-bookings", label: "حجوزاتي", icon: Calendar, requiresAuth: true },
] as const;

// فئات وأقسام العلا المستوحاة من جاذر إن (Image 3)
const gathernCategories = [
  {
    label: "شقق، استوديو، غرف، فلل",
    href: "/apartments",
    icon: Building2,
    badgeColor: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300",
  },
  {
    label: "شاليهات، استراحات، منتجعات صحراوية",
    href: "/apartments?type=resort",
    icon: TreePalm,
    badgeColor: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-300",
  },
  {
    label: "مزارع وبساتين النخيل",
    href: "/apartments?location=AlUla+Oasis",
    icon: Sparkles,
    badgeColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  {
    label: "مخيمات وكرفانات رصد النجوم",
    href: "/apartments?type=camp",
    icon: Tent,
    badgeColor: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  },
  {
    label: "شقق مخدومة وتراثية",
    href: "/apartments?location=AlUla+Old+Town",
    icon: Hotel,
    badgeColor: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
  },
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, role, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const unreadCount = useQuery(
    api.messages.unreadCount,
    isAuthenticated && !DEMO_MODE ? {} : "skip",
  ) ?? 0;

  const isAdmin = isAuthorizedAdmin(role, user?.email, user?.phone);
  const ownerStatus = useQuery(
    api.owners.myOwnerStatus,
    isAuthenticated && !DEMO_MODE ? {} : "skip",
  );
  const accountPath = isAdmin
    ? "/admin"
    : role === "owner" || ownerStatus?.status === "pending"
    ? "/owner"
    : "/dashboard";
  const accountLabel = isAdmin
    ? "الإدارة"
    : role === "owner"
    ? "لوحة المالك"
    : ownerStatus?.status === "pending"
    ? "طلب المالك"
    : "حسابي";

  // Check if any search/filter is active (for badge dot)
  const hasActiveSearch =
    searchParams.has("q") ||
    searchParams.has("location") ||
    searchParams.has("sortBy") ||
    searchParams.has("bedrooms") ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice") ||
    searchParams.has("type");

  const authHref = (href: string, requiresAuth: boolean) =>
    requiresAuth && !isAuthenticated ? `/auth?returnTo=${encodeURIComponent(href)}` : href;

  return (
    <>
      {/* ─── Top Desktop / Mobile Header ─── */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-[#15100C]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5" aria-label="الرئيسية">
            <img
              src="/logo-icon.png"
              alt="شقق العلا"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
            />
            <div>
              <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                شقق العلا
              </span>
              <span className="-mt-1 block text-[9px] font-bold tracking-wider text-neutral-400">
                ALULA STAYS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1.5 md:flex" aria-label="التنقل الرئيسي">
            {navLinks.map((link) => {
              const isActive = isActivePath(location.pathname, link.href);
              return (
                <Link
                  key={link.href}
                  to={authHref(link.href, link.requiresAuth)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                    isActive
                      ? "bg-[var(--clay-accent)] text-white shadow-xs"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <link.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated && (
              <Link
                to="/messages"
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                  isActivePath(location.pathname, "/messages")
                    ? "bg-[var(--clay-accent)] text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                )}
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                الرسائل
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* بوابة المضيفين (Host CTA on Desktop) */}
            <Link
              to="/owner"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--clay-accent)]/30 text-xs font-bold text-[var(--clay-accent)] hover:bg-[var(--clay-accent-soft)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>بوابة المضيفين</span>
            </Link>

            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* User Account Button (Desktop) */}
            <Link
              to={isAuthenticated ? accountPath : "/auth"}
              className={cn(
                "hidden sm:flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                isAuthenticated
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200"
                  : "bg-[var(--clay-accent)] text-white shadow-md hover:opacity-90",
              )}
            >
              <div className="w-5 h-5 rounded-full bg-[var(--clay-gold)] flex items-center justify-center text-[10px] text-white font-bold">
                {isAuthenticated && user?.name ? user.name.charAt(0) : <User className="w-3 h-3" />}
              </div>
              <span>{isAuthenticated ? accountLabel : "تسجيل الدخول"}</span>
            </Link>

            {/* ─── Mobile: Search Icon + Hamburger ─── */}
            <div className="flex items-center gap-1.5 md:hidden">
              {/* Search Icon Button */}
              <button
                type="button"
                onClick={() => setSearchSheetOpen(true)}
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="البحث والفلاتر"
              >
                <Search className="h-5 w-5" strokeWidth={1.75} />
                {/* Active filter badge dot */}
                {hasActiveSearch && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[var(--clay-accent)] border-2 border-white dark:border-[#15100C]" />
                )}
              </button>

              {/* Hamburger Menu */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="القائمة"
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Search & Filter Bottom Sheet (Mobile) ─── */}
      <SearchFilterSheet
        isOpen={searchSheetOpen}
        onClose={() => setSearchSheetOpen(false)}
      />

      {/* ─── Gathern Style Mobile Drawer Menu (Image 3) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[85%] max-w-sm h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col z-50 text-right overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
              <Link
                to={isAuthenticated ? accountPath : "/auth"}
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 rounded-full bg-[var(--clay-accent-soft)] flex items-center justify-center text-[var(--clay-accent)] shadow-xs"
              >
                <User className="w-5 h-5" strokeWidth={1.75} />
              </Link>

              <div className="flex items-center gap-2">
                <img
                  src="/logo-icon.png"
                  alt="شقق العلا"
                  className="h-7 w-auto object-contain"
                />
                <span className="font-black text-base text-neutral-900 dark:text-neutral-100">
                  شقق العلا
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Categories List */}
            <div className="p-4 space-y-1.5">
              {gathernCategories.map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {cat.label}
                  </span>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      cat.badgeColor,
                    )}
                  >
                    <cat.icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mx-4 my-2 border-t border-neutral-100 dark:border-neutral-800" />

            {/* Host Banner in Drawer */}
            <div className="p-4">
              <Link
                to="/owner"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[var(--clay-accent)] to-[var(--clay-gold)] text-white shadow-md"
              >
                <div>
                  <span className="block text-xs font-black">بوابة المضيفين</span>
                  <span className="block text-[10px] text-white/90">اعرض وحدتك في العلا</span>
                </div>
                <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>

            {/* Language & Social Links */}
            <div className="mt-auto p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => alert("قريباً: النسخة الإنجليزية")}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  <Globe className="w-4 h-4" strokeWidth={1.75} />
                  <span>ENGLISH</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-neutral-400">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[var(--clay-accent)]">
                  <Instagram className="w-4 h-4" strokeWidth={1.75} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[var(--clay-accent)]">
                  <Twitter className="w-4 h-4" strokeWidth={1.75} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[var(--clay-accent)]">
                  <Youtube className="w-4 h-4" strokeWidth={1.75} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom App Bar ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#15100C]/95 backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navLinks.map((link) => {
            const isActive = isActivePath(location.pathname, link.href);
            return (
              <Link
                key={link.href}
                to={authHref(link.href, link.requiresAuth)}
                className={cn(
                  "flex min-w-[60px] flex-col items-center gap-0.5 transition-colors",
                  isActive ? "text-[var(--clay-accent)]" : "text-neutral-400 dark:text-neutral-500",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <link.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />
                <span className="text-[10px] font-bold">{link.label}</span>
              </Link>
            );
          })}

          <Link
            to={isAuthenticated ? accountPath : "/auth"}
            className={cn(
              "flex min-w-[60px] flex-col items-center gap-0.5 transition-colors",
              isActivePath(location.pathname, accountPath)
                ? "text-[var(--clay-accent)]"
                : "text-neutral-400 dark:text-neutral-500",
            )}
          >
            <User className={cn("h-5 w-5", isActivePath(location.pathname, accountPath) && "stroke-[2.5]")} strokeWidth={isActivePath(location.pathname, accountPath) ? 2.5 : 1.75} aria-hidden="true" />
            <span className="text-[10px] font-bold">{isAuthenticated ? "حسابي" : "دخول"}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
