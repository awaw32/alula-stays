import { useEffect } from "react";
import { useLocation } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";

export function useVisitorTracker() {
  const location = useLocation();
  const recordVisit = useMutation(api.analytics.recordVisit);

  useEffect(() => {
    if (DEMO_MODE) return;

    try {
      let visitorId = localStorage.getItem("alula_visitor_id");
      if (!visitorId) {
        visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("alula_visitor_id", visitorId);
      }

      recordVisit({
        path: location.pathname,
        visitorId,
        referrer: document.referrer || undefined,
      }).catch(() => {
        // Silently catch tracking errors so app performance is unaffected
      });
    } catch {
      // Ignore storage errors in private browsing
    }
  }, [location.pathname, recordVisit]);
}
