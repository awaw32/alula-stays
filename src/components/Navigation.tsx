import { cn } from "@/lib/utils";
import { Home, Search, Heart, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { href: "/", label: "الرئيسية", labelEn: "Home", icon: Home },
  { href: "/apartments", label: "الشقق", labelEn: "Apartments", icon: Search },
  { href: "/favorites", label: "المفضلة", labelEn: "Favorites", icon: Heart },
];

export function Navigation() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-sm">عُ</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-[var(--foreground)] tracking-tight">
                شقق العلا
              </span>
              <span className="block text-[10px] text-[var(--muted-foreground)] -mt-1 tracking-wide">
                ALULA APARTMENTS
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[var(--clay-accent)] text-white shadow-md"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--clay-surface)] hover:text-[var(--foreground)]",
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-2 clay-sm px-4 py-2 text-sm font-medium text-[var(--clay-accent)] hover:bg-[var(--clay-accent-soft)] transition-colors"
              >
                <User className="w-4 h-4" />
                حسابي
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden md:flex clay-btn text-sm py-2 px-4"
              >
                تسجيل الدخول
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden clay-sm p-2.5"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 left-4 right-4 clay p-4 z-50">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-[var(--clay-accent)] text-white"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--clay-surface)]",
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <hr className="border-[var(--border)] my-1" />
              <Link
                to={isAuthenticated ? "/dashboard" : "/auth"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium clay-btn text-center justify-center"
              >
                <User className="w-5 h-5" />
                {isAuthenticated ? "حسابي" : "تسجيل الدخول"}
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--background)]/90 backdrop-blur-xl border-t border-[var(--border)] safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all min-w-[60px]",
                  isActive
                    ? "text-[var(--clay-accent)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all",
                    isActive && "bg-[var(--clay-accent-soft)] shadow-sm",
                  )}
                >
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          <Link
            to={isAuthenticated ? "/dashboard" : "/auth"}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all min-w-[60px]",
              location.pathname === "/auth" || location.pathname === "/dashboard"
                ? "text-[var(--clay-accent)]"
                : "text-[var(--muted-foreground)]",
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all",
                (location.pathname === "/auth" || location.pathname === "/dashboard") &&
                  "bg-[var(--clay-accent-soft)] shadow-sm",
              )}
            >
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">
              {isAuthenticated ? "حسابي" : "دخول"}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
