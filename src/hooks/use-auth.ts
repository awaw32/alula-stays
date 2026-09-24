import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { DEMO_MODE } from "@/lib/demo-data";

function useDemoAuth() {
  return {
    isLoading: false,
    isAuthenticated: false,
    user: null,
    role: null,
    signIn: async () => {
      throw new Error("الوضع التجريبي: اربط Convex لتفعيل تسجيل الدخول.");
    },
    signOut: async () => {},
  };
}

function useLiveAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // Derive isLoading directly from the dependencies instead of managing separate state
  const isLoading = isAuthLoading || user === undefined;

  return {
    isLoading,
    isAuthenticated,
    user,
    role: user?.role ?? null,
    signIn,
    signOut,
  };
}

export function useAuth() {
  // NOTE: hooks must be called unconditionally — DEMO_MODE only switches
  // which query args we pass ("skip"), never whether we call hooks.
  // In live mode this behaves exactly as before.
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser, DEMO_MODE ? "skip" : undefined);
  // In demo mode there is no ConvexAuthProvider, so useAuthActions() returns
  // undefined — keep the raw value and only destructure in live mode.
  const authActions = useAuthActions() as
    | { signIn: (...args: unknown[]) => Promise<unknown>; signOut: () => Promise<void> }
    | undefined;

  if (DEMO_MODE) {
    return {
      isLoading: false,
      isAuthenticated: false,
      user: null,
      role: null,
      signIn: async () => {
        throw new Error("الوضع التجريبي: اربط Convex لتفعيل تسجيل الدخول.");
      },
      signOut: async () => {},
    };
  }

  const isLoading = isAuthLoading || user === undefined;

  return {
    isLoading,
    isAuthenticated,
    user,
    role: user?.role ?? null,
    signIn:
      authActions?.signIn ??
      (async () => {
        throw new Error("المصادقة غير جاهزة بعد.");
      }),
    signOut: authActions?.signOut ?? (async () => {}),
  };
}

// Keep named exports referenced by older code paths (tree-shaken if unused).
export const __useDemoAuth = useDemoAuth;
export const __useLiveAuth = useLiveAuth;

