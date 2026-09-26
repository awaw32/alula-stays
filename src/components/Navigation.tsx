import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { isAuthorizedAdmin } from "@/types/auth";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";
import { Calendar, Heart, Home, Menu, MessageSquare, Search, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

const navLinks = [
  { href: "/", label: "الرئيسية", icon: Home, requiresAuth: false },
  { href: "/apartments", label: "الشقق", icon: Search, requiresAuth: false },
  { href: "/favorites", label: "المفضلة", icon: Heart, requiresAuth: true },
  { href: "/my-bookings", label: "حجوزاتي", icon: Calendar, requiresAuth: true },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const location = useLocation();
  const { isAuthenticated, role, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = useQuery(
    api.messages.unreadCount,
    isAuthenticated && !DEMO_MODE ? {} : "skip",
  ) ?? 0;

  // التحقق الحصري: لا يظهر زر الإدارة إطلاقاً إلا للحسابات المصرح بها حصراً
  const isAdmin = isAuthorizedAdmin(role, user?.email);
  const accountPath = isAdmin ? "/admin" : role === "owner" ? "/owner" : "/dashboard";
  const accountLabel = isAdmin ? "الإدارة" : role === "owner" ? "لوحة المالك" : "حسابي";
  const authHref = (href: string, requiresAuth: boolean) =>
    requiresAuth && !isAuthenticated ? `/auth?returnTo=${encodeURIComponent(href)}` : href;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5" aria-label="العودة إلى الصفحة الرئيسية">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] shadow-md transition-shadow group-hover:shadow-lg">
              <span className="text-sm font-bold text-white">عُ</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">شقق العلا</span>
              <span className="-mt-1 block text-[10px] tracking-wide text-[var(--muted-foreground)]">ALULA APARTMENTS</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
            {navLinks.map((link) => {
              const isActive = isActivePath(location.pathname, link.href);
              return (
                <Link
                  key={link.href}
                  to={authHref(link.href, link.requiresAuth)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[var(--clay-accent)] text-white shadow-md"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--clay-surface)] hover:text-[var(--foreground)]",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <link.icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <Link
                to="/messages"
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActivePath(location.pathname, "/messages")
                    ? "bg-[var(--clay-accent)] text-white shadow-md"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--clay-surface)] hover:text-[var(--foreground)]",
                )}
                aria-current={isActivePath(location.pathname, "/messages") ? "page" : undefined}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                الرسائل
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={isAuthenticated ? accountPath : "/auth"}
              className={cn(
                "hidden items-center gap-2 text-sm font-medium transition-colors md:flex",
                isAuthenticated
                  ? "clay-sm px-4 py-2 text-[var(--clay-accent)] hover:bg-[var(--clay-accent-soft)]"
                  : "clay-btn px-4 py-2",
              )}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {isAuthenticated ? accountLabel : "تسجيل الدخول"}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="clay-sm p-2.5 md:hidden"
              aria-label={mobileOpen ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div id="mobile-navigation" className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="إغلاق قائمة التنقل"
          />
          <div className="clay absolute left-4 right-4 top-16 z-50 p-4">
            <nav className="flex flex-col gap-2" aria-label="التنقل على الهاتف">
              {navLinks.map((link) => {
                const isActive = isActivePath(location.pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    to={authHref(link.href, link.requiresAuth)}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[var(--clay-accent)] text-white"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--clay-surface)]",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <link.icon className="h-5 w-5" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <Link
                  to="/messages"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActivePath(location.pathname, "/messages")
                      ? "bg-[var(--clay-accent)] text-white"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--clay-surface)]",
                  )}
                  aria-current={isActivePath(location.pathname, "/messages") ? "page" : undefined}
                >
                  <span className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5" aria-hidden="true" />
                    الرسائل
                  </span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <Separator className="my-1" />
              <Link
                to={isAuthenticated ? accountPath : "/auth"}
                onClick={() => setMobileOpen(false)}
                className="clay-btn flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-center text-sm font-medium"
              >
                <User className="h-5 w-5" aria-hidden="true" />
                {isAuthenticated ? accountLabel : "تسجيل الدخول"}
              </Link>
            </nav>
          </div>
        </div>
      )}

      <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl md:hidden" aria-label="التنقل السريع">
        <div className="flex h-16 items-center justify-around px-2">
          {navLinks.map((link) => {
            const isActive = isActivePath(location.pathname, link.href);
            return (
              <Link
                key={link.href}
                to={authHref(link.href, link.requiresAuth)}
                className={cn(
                  "flex min-w-[60px] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-all",
                  isActive ? "text-[var(--clay-accent)]" : "text-[var(--muted-foreground)]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={cn("rounded-xl p-1.5 transition-all", isActive && "bg-[var(--clay-accent-soft)] shadow-sm")}>
                  <link.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          {isAuthenticated && (
            <Link
              to="/messages"
              className={cn(
                "relative flex min-w-[60px] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-all",
                isActivePath(location.pathname, "/messages") ? "text-[var(--clay-accent)]" : "text-[var(--muted-foreground)]",
              )}
              aria-current={isActivePath(location.pathname, "/messages") ? "page" : undefined}
            >
              <span className={cn("relative rounded-xl p-1.5 transition-all", isActivePath(location.pathname, "/messages") && "bg-[var(--clay-accent-soft)] shadow-sm")}>
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">الرسائل</span>
            </Link>
          )}
          <Link
            to={isAuthenticated ? accountPath : "/auth"}
            className={cn(
              "flex min-w-[60px] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-all",
              isActivePath(location.pathname, accountPath) ? "text-[var(--clay-accent)]" : "text-[var(--muted-foreground)]",
            )}
            aria-current={isActivePath(location.pathname, accountPath) ? "page" : undefined}
          >
            <span className={cn("rounded-xl p-1.5 transition-all", isActivePath(location.pathname, accountPath) && "bg-[var(--clay-accent-soft)] shadow-sm")}>
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-medium">{isAuthenticated ? "حسابي" : "دخول"}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

