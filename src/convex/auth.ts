import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { phoneOtp } from "./auth/phoneOtp";
import { emailOtp } from "./auth/emailOtp";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [phoneOtp, emailOtp, Anonymous],
  session: {
    // الاحتفاظ بتسجيل الدخول لمدة 30 يوماً لعدم إزعاج المستخدم وتوفير تكاليف الرسائل المتكررة
    totalDurationMs: 1000 * 60 * 60 * 24 * 30, // 30 days
    inactiveDurationMs: 1000 * 60 * 60 * 24 * 14, // 14 days
  },
});