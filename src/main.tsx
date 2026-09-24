import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth, RequireRole } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { DEMO_MODE } from "@/lib/demo-data";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Apartments = lazy(() => import("./pages/Apartments.tsx"));
const ApartmentDetail = lazy(() => import("./pages/ApartmentDetail.tsx"));
const Favorites = lazy(() => import("./pages/Favorites.tsx"));
const MyBookings = lazy(() => import("./pages/MyBookings.tsx"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard.tsx"));
const AddApartment = lazy(() => import("./pages/AddApartment.tsx"));
const EditApartment = lazy(() => import("./pages/EditApartment.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const routerBasename =
  (import.meta.env.BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  undefined;

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div
      dir="rtl"
      className="sticky top-0 z-50 bg-amber-100 text-amber-900 text-xs sm:text-sm px-4 py-2 text-center border-b border-amber-200"
    >
      الوضع التجريبي: يتم عرض بيانات تجريبية. اربط{" "}
      <code dir="ltr" className="font-mono">VITE_CONVEX_URL</code> لتفعيل الحجوزات
      وتسجيل الدخول.
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter basename={routerBasename}>
      <RouteSyncer />
      <DemoBanner />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/apartments" element={<Apartments />} />
          <Route path="/apartment/:id" element={<ApartmentDetail />} />
          <Route
            path="/favorites"
            element={
              <RequireAuth>
                <Favorites />
              </RequireAuth>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <RequireAuth>
                <MyBookings />
              </RequireAuth>
            }
          />
          <Route
            path="/auth"
            element={<AuthPage redirectAfterAuth="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/owner"
            element={
              <RequireRole roles={["owner", "admin"]}>
                <OwnerDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/owner/add"
            element={
              <RequireRole roles={["owner", "admin"]}>
                <AddApartment />
              </RequireRole>
            }
          />
          <Route
            path="/owner/edit/:id"
            element={
              <RequireRole roles={["owner", "admin"]}>
                <EditApartment />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole roles={["admin"]}>
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function AppRoot() {
  const convexClient = React.useMemo(() => {
    const url = DEMO_MODE ? "https://demo-dummy.convex.cloud" : convexUrl;
    if (!url) return null;
    try {
      return new ConvexReactClient(url);
    } catch (err) {
      console.error("[Convex] init failed:", err);
      return null;
    }
  }, []);

  // Demo mode: all queries use "skip" so the dummy client never makes
  // network calls — no useQuery is ever executed without a provider.
  // The fake useAuth below keeps useConvexAuth()/useAuthActions() working
  // (unauthenticated, isLoading=false) without any ConvexAuthProvider.
  if (!convexClient) return <RouteLoading />;
  if (DEMO_MODE) {
    const demoUseAuth = () => ({
      isLoading: false,
      isAuthenticated: false,
      fetchAccessToken: async () => null,
    });
    return (
      <ConvexProviderWithAuth client={convexClient} useAuth={demoUseAuth}>
        <AppRoutes />
      </ConvexProviderWithAuth>
    );
  }
  return (
    <ConvexAuthProvider client={convexClient}>
      <AppRoutes />
    </ConvexAuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <AppRoot />
      <Toaster />
    </RootErrorBoundary>
  </StrictMode>,
);
