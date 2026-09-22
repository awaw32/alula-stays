import { useAuth } from "@/hooks/use-auth";
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

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

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
