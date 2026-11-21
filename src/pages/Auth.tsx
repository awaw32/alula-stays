import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { DEMO_MODE } from "@/lib/demo-data";
import {
  ChevronDown,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getErrorMessage } from "@/lib/error-message";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  formatPhoneDisplay,
  isValidSaudiPhone,
  normalizePhone,
} from "@/lib/phone";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

export default function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerMode = searchParams.get("owner") === "1";
  const returnTo = searchParams.get("returnTo");
  const redirect =
    ownerMode && !returnTo
      ? "/owner"
      : resolveRedirectAfterAuth(
        returnTo,
        redirectAfterAuth,
      );

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");

  useSeo({
    title: "تسجيل الدخول",
    description: "سجّل الدخول إلى منصة شقق العلا عبر رقم الجوال أو البريد الإلكتروني.",
    path: "/auth",
    noIndex: true,
  });

  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [activeIdentifier, setActiveIdentifier] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const demoBlock = async () => {
    setError("الوضع التجريبي: اربط VITE_CONVEX_URL لتفعيل تسجيل الدخول.");
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (DEMO_MODE) {
      await demoBlock();
      return;
    }

    setError(null);

    if (method === "phone") {
      const normalized = normalizePhone(phoneInput);
      if (!isValidSaudiPhone(normalized)) {
        setError("يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05 أو 5 (مثال: 0501234567)");
        return;
      }

      setIsLoading(true);
      try {
        await signIn("phone-otp", { phone: normalized });
        setActiveIdentifier(normalized);
        setStep("otp");
        setOtp("");
        setResendCooldown(60);
        toast.success("تم إرسال رمز التحقق عبر تطبيق واتساب 💬");
      } catch (err) {
        console.error("[Phone Auth Error]", err);
        setError(
          getErrorMessage(
            err,
            "تعذر إرسال رمز التحقق عبر واتساب. يرجى التأكد من الرقم والمحاولة مرة أخرى.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        setError("يرجى إدخال بريد إلكتروني صحيح");
        return;
      }

      setIsLoading(true);
      try {
        await signIn("email-otp", { email: cleanEmail });
        setActiveIdentifier(cleanEmail);
        setStep("otp");
        setOtp("");
        setResendCooldown(60);
        toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
      } catch (err) {
        console.error("[Email Auth Error]", err);
        setError(
          getErrorMessage(err, "تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى."),
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (method === "phone") {
        await signIn("phone-otp", {
          phone: activeIdentifier,
          code,
        });
      } else {
        await signIn("email-otp", {
          email: activeIdentifier,
          code,
        });
      }

      toast.success("تم تسجيل الدخول بنجاح! مرحباً بك في شقق العلا");
      navigate(redirect);
    } catch (err) {
      console.error("[Verify OTP Error]", err);
      setError("رمز التحقق غير صحيح أو قد انتهت صلاحيته. يرجى المحاولة مجدداً.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen flex-col items-center justify-center bg-neutral-100/60 dark:bg-[#120E0A] px-4 py-8 overflow-x-hidden"
    >
      {/* Background Soft Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[var(--clay-gold)]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-[390px] mx-auto">
        {/* ─── Premium Auth Card ─── */}
        <Card className="relative border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-neutral-900 shadow-xl rounded-3xl overflow-hidden">
          {/* Close 'X' Button — quiet top-left corner */}
          <button
            type="button"
            onClick={() => navigate(returnTo || "/")}
            aria-label="إغلاق"
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors z-20"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>

          <CardHeader className="flex flex-col items-center pb-2 pt-7 px-6 text-center">
            {/* Centered Brand Mark */}
            <div className="mb-3 flex items-center gap-2">
              <img
                src="/logo-icon.png"
                alt="شقق العلا"
                className="h-10 w-auto object-contain"
              />
              <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-neutral-100">
                شقق العلا
              </span>
            </div>

            {/* Single subtitle — no "أهلاً بك" */}
            <CardDescription className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-[280px]">
              {ownerMode
                ? "سجّل دخولك لإدارة شققك وحجوزاتك واستقبال النزلاء"
                : "سجّل دخولك برقم الجوال للمتابعة"}
            </CardDescription>

            {/* ─── Segmented Control (Phone / Email) ─── */}
            {step === "input" && (
              <div className="mt-4 w-full relative bg-stone-100 dark:bg-neutral-800 p-1 rounded-2xl flex">
                {/* Animated Pill Indicator */}
                <motion.div
                  layoutId="auth-tab-pill"
                  className="absolute top-1 bottom-1 rounded-[14px] bg-white dark:bg-neutral-900 shadow-sm"
                  style={{
                    width: "calc(50% - 4px)",
                    left: method === "phone" ? "4px" : "calc(50% + 0px)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMethod("phone");
                    setError(null);
                  }}
                  className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-[14px] transition-colors ${method === "phone"
                      ? "text-[var(--clay-accent)]"
                      : "text-neutral-500 hover:text-neutral-700"
                    }`}
                >
                  رقم الجوال
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("email");
                    setError(null);
                  }}
                  className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-[14px] transition-colors ${method === "email"
                      ? "text-[var(--clay-accent)]"
                      : "text-neutral-500 hover:text-neutral-700"
                    }`}
                >
                  البريد الإلكتروني
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-1 px-6 pb-6">
            {/* ── Step 1: Input ── */}
            {step === "input" && (
              <form onSubmit={handleSendCode} className="space-y-4">
                {method === "phone" ? (
                  <div className="space-y-2">
                    {/* Professional Phone Input */}
                    <div className="relative flex items-center h-[52px] rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 transition-all focus-within:border-[var(--clay-accent)] focus-within:ring-2 focus-within:ring-[var(--clay-accent)]/20">
                      <div
                        dir="ltr"
                        className="flex select-none items-center gap-1.5 px-3 h-full border-l border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200"
                      >
                        <span className="text-base" role="img" aria-label="السعودية">
                          🇸🇦
                        </span>
                        <span className="tracking-wider">+966</span>
                      </div>

                      <Input
                        id="phone-input"
                        type="tel"
                        dir="ltr"
                        inputMode="numeric"
                        placeholder="50 123 4567"
                        value={phoneInput}
                        onChange={(e) => {
                          setPhoneInput(e.target.value);
                          setError(null);
                        }}
                        disabled={isLoading}
                        autoFocus
                        className="border-0 bg-transparent text-left font-mono text-base font-bold shadow-none focus-visible:ring-0 h-full"
                      />
                    </div>

                    <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400 pr-0.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 shrink-0 text-stone-400" strokeWidth={1.75} />
                      <span>ستصلك رسالة فورية برمز التحقق عبر واتساب</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative flex items-center">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" strokeWidth={1.75} />
                      <Input
                        id="email-input"
                        type="email"
                        dir="ltr"
                        placeholder="name@example.com"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setError(null);
                        }}
                        disabled={isLoading}
                        autoFocus
                        className="h-[52px] rounded-2xl pr-10 text-left font-sans text-sm border-2 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-right text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* Primary "متابعة" Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-2xl bg-[var(--clay-accent)] hover:opacity-90 text-white text-base font-bold shadow-lg shadow-[var(--clay-accent)]/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      جارٍ المعالجة...
                    </span>
                  ) : (
                    <span>متابعة</span>
                  )}
                </Button>
              </form>
            )}

            {/* ── Step 2: OTP Verification ── */}
            {step === "otp" && (
              <div className="space-y-5 text-center">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-4 dark:bg-amber-950/20">
                  <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    {method === "phone" ? <Phone className="size-5" strokeWidth={1.75} /> : <Mail className="size-5" strokeWidth={1.75} />}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {method === "phone" ? "أرسلنا رمز التحقق عبر تطبيق واتساب 💬" : "أرسلنا رمز التحقق إلى بريدك"}
                  </h3>
                  <p dir="ltr" className="mt-1 font-mono text-sm font-bold text-[var(--clay-accent)]">
                    {method === "phone" ? formatPhoneDisplay(activeIdentifier) : activeIdentifier}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium text-neutral-500">
                    أدخل الرمز المكون من 6 أرقام
                  </label>
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      value={otp}
                      onChange={(val) => {
                        setOtp(val);
                        setError(null);
                        if (val.length === 6 && !isLoading) {
                          handleVerifyOtp(val);
                        }
                      }}
                      maxLength={6}
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="size-11 sm:size-12 rounded-xl border-2 text-lg font-bold"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isLoading || otp.length !== 6}
                  className="h-12 w-full rounded-2xl bg-[var(--clay-accent)] text-white text-base font-bold shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      جارٍ التحقق...
                    </span>
                  ) : (
                    <span>تأكيد ومتابعة</span>
                  )}
                </Button>

                <div className="pt-2 flex flex-col items-center gap-2 text-xs">
                  {resendCooldown > 0 ? (
                    <p className="text-neutral-400">
                      يمكنك إعادة طلب الرمز خلال <span className="font-bold text-[var(--clay-accent)]">{resendCooldown} ثانية</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendCode()}
                      disabled={isLoading}
                      className="font-bold text-[var(--clay-accent)] hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw className="size-3.5" strokeWidth={1.75} />
                      إعادة إرسال رمز التحقق
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setOtp("");
                      setError(null);
                    }}
                    className="text-neutral-500 hover:text-neutral-800 underline"
                  >
                    تغيير الرقم المدخل
                  </button>
                </div>
              </div>
            )}

            {/* ─── Bottom: Host Portal Link ─── */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <Link
                to="/owner"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--clay-accent)] hover:underline"
              >
                <span>تبي تعرض وحدتك؟</span>
                <span className="underline">بوابة المضيفين</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Trust Footer */}
        <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-neutral-400">
          <ShieldCheck className="size-3.5 text-emerald-600" strokeWidth={1.75} />
          <span>منصة معتمدة ومحمية بأحدث معايير الأمان والتشفير</span>
        </p>
      </div>
    </main>
  );
}
