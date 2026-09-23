import { useAuth } from "@/hooks/use-auth";
import { DEMO_MODE } from "@/lib/demo-data";
import { Link } from "react-router";
import type { UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="جاري التحميل" />
    </main>
  );
}

function getReturnTo(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}`;
}

function DemoLocked({ title }: { title: string }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-xl border p-6 text-center">
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-7">هذه الصفحة تحتاج تسجيل الدخول. اربط VITE_CONVEX_URL لتفعيل الحسابات والحجوزات.</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">العودة للرئيسية</Link>
      </div>
    </main>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (DEMO_MODE) return <DemoLocked title="سجل الدخول للمتابعة" />;

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(getReturnTo(location))}`}
        replace
      />
    );
  }

  return children;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: readonly UserRole[];
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (DEMO_MODE) return <DemoLocked title="لوحة خاصة" />;

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(getReturnTo(location))}`}
        replace
      />
    );
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard?forbidden=1" replace />;
  }

  return children;
}
