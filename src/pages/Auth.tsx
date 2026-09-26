import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { DEMO_MODE } from "@/lib/demo-data";
import logo from "@/assets/logo.svg";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/error-message";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  formatPhoneDisplay,
  isValidSaudiPhone,
  normalizePhone,
} from "@/lib/phone";
import { toast } from "sonner";

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
  const redirect =
    ownerMode && !searchParams.get("returnTo")
      ? "/owner/profile"
      : resolveRedirectAfterAuth(
          searchParams.get("returnTo"),
          redirectAfterAuth,
        );

  // طريقة الدخول: الافتراضي هو رقم الجوال (كما طلب المستخدم تماماً)
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");

  // حقول الإدخال
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // الرقم المعتمد بعد إرسال الرمز للتحقق
  const [activeIdentifier, setActiveIdentifier] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // عداد إعادة الإرسال
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

  // إرسال رمز التحقق (جوال أو إيميل)
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
        setError("يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05 أو 5 (مثال: 0512345678)");
        return;
      }

      setIsLoading(true);
      try {
        await signIn("phone-otp", { phone: normalized });
        setActiveIdentifier(normalized);
        setStep("otp");
        setOtp("");
        setResendCooldown(60);
        toast.success("تم إرسال رمز التحقق في رسالة نصية (SMS)");
      } catch (err) {
        console.error("[Phone Auth Error]", err);
        setError(
          getErrorMessage(
            err,
            "تعذر إرسال رمز التحقق عبر الرسائل القصيرة. يرجى التأكد من الرقم والمحاولة مرة أخرى.",
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

  // تأكيد رمز التحقق للدخول
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify ?? otp;
    if (code.length !== 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    if (DEMO_MODE) {
      await demoBlock();
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

  const handleGuestLogin = async () => {
    if (DEMO_MODE) {
      await demoBlock();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      setError(getErrorMessage(err, "تعذر الدخول كضيف. حاول مرة أخرى."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-amber-50/20 to-background px-4 py-12 dark:via-amber-950/10"
    >
      {/* خلفية جمالية تعكس طبيعة العلا وسحر الرمال */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--clay-gold)]/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-[var(--clay-accent)]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Card className="border border-border/80 bg-background/95 shadow-xl backdrop-blur-xl sm:rounded-3xl">
          <CardHeader className="flex flex-col items-center pb-4 text-center">
            {/* الشعار الفاخر المستوحى من هوية العلا وعراقتها */}
            <div className="group relative mb-3 flex flex-col items-center">
              <div
                onClick={() => navigate("/")}
                className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-[#9C441E] via-[#C25E2E] to-[#D97706] p-1.5 shadow-lg shadow-amber-950/20 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                role="button"
                tabIndex={0}
                aria-label="الرئيسية"
              >
                <img
                  src={logo}
                  alt="شعار شقق العلا"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {ownerMode ? "بوابة مالكي الشقق" : "مرحباً بك في شقق العلا"}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              {ownerMode
                ? "سجّل دخولك لإدارة شققك وحجوزاتك واستقبال النزلاء"
                : "بوابتك الموثوقة لحجز أرقى الشقق والإقامات السكنية في العلا"}
            </CardDescription>

            {/* مفتاح التبديل بين الهاتف والبريد الإلكتروني (عند خطوة الإدخال) */}
            {step === "input" && (
              <div className="mt-5 grid w-full grid-cols-2 gap-1.5 rounded-2xl bg-muted/60 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("phone");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold transition-all duration-200 ${
                    method === "phone"
                      ? "bg-background text-[var(--clay-accent)] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="size-4" />
                  <span>رقم الجوال</span>
                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                    افتراضي
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod("email");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold transition-all duration-200 ${
                    method === "email"
                      ? "bg-background text-[var(--clay-accent)] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="size-4" />
                  <span>البريد الإلكتروني</span>
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* ── الخطوة الأولى: إدخال رقم الجوال أو البريد ── */}
            {step === "input" && (
              <form onSubmit={handleSendCode} className="space-y-4">
                {method === "phone" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="phone-input"
                      className="block text-right text-xs font-bold text-foreground"
                    >
                      رقم الجوال السعودي
                    </label>
                    <div className="relative flex items-center rounded-2xl border border-input bg-background/50 shadow-sm focus-within:border-[var(--clay-accent)] focus-within:ring-2 focus-within:ring-[var(--clay-accent)]/20">
                      {/* بادئة المملكة العربية السعودية */}
                      <div
                        dir="ltr"
                        className="flex select-none items-center gap-1.5 border-r border-border bg-muted/40 px-3 py-2.5 text-sm font-bold text-foreground"
                      >
                        <span className="text-base" role="img" aria-label="السعودية">
                          🇸🇦
                        </span>
                        <span className="text-xs tracking-wider">+966</span>
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
                        className="border-0 bg-transparent text-left font-mono text-base font-semibold shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      أدخل رقم جوالك (مثال: 0501234567) لتصلك رسالة SMS سريعة برمز الدخول.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      htmlFor="email-input"
                      className="block text-right text-xs font-bold text-foreground"
                    >
                      عنوان البريد الإلكتروني
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute right-3 top-3.5 size-4 text-muted-foreground" />
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
                        className="rounded-2xl pr-10 text-left font-sans text-sm shadow-sm"
                      />
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      سنرسل لك رمز تحقق إلى بريدك الإلكتروني لتسجيل الدخول فوراً.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-right text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="clay-btn h-12 w-full rounded-2xl text-base font-bold shadow-md"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      جارٍ إرسال رمز التحقق...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>إرسال رمز التحقق</span>
                      <ArrowRight className="size-4 rotate-180" />
                    </span>
                  )}
                </Button>

                {/* شارة حفظ تسجيل الدخول لـ 30 يوماً */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/40 p-2.5 text-center text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                  <span>
                    يبقى تسجيل دخولك محفوظاً ومفعل لمدة <strong>30 يوماً</strong> لراحتك وتوفير وقتك.
                  </span>
                </div>
              </form>
            )}

            {/* ── الخطوة الثانية: إدخال رمز التحقق (OTP) ── */}
            {step === "otp" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-4 text-center dark:bg-amber-950/20">
                  <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    {method === "phone" ? (
                      <Phone className="size-5" />
                    ) : (
                      <Mail className="size-5" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {method === "phone"
                      ? "أرسلنا رمز التحقق في رسالة نصية (SMS)"
                      : "أرسلنا رمز التحقق إلى بريدك الإلكتروني"}
                  </h3>
                  <p
                    dir="ltr"
                    className="mt-1 font-mono text-sm font-bold text-[var(--clay-accent)]"
                  >
                    {method === "phone"
                      ? formatPhoneDisplay(activeIdentifier)
                      : activeIdentifier}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-center text-xs font-medium text-muted-foreground">
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
                      disabled={isLoading}
                      autoFocus
                    >
                      <InputOTPGroup className="gap-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="h-12 w-10 rounded-xl border border-input bg-background text-lg font-bold shadow-sm sm:w-12"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-center text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isLoading || otp.length !== 6}
                    className="clay-btn h-12 w-full rounded-2xl text-base font-bold shadow-md"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-5 animate-spin" />
                        جارٍ التحقق...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="size-5" />
                        تأكيد والدخول
                      </span>
                    )}
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-2 pt-1 text-center text-xs text-muted-foreground">
                  {resendCooldown > 0 ? (
                    <p className="text-muted-foreground">
                      يمكنك إعادة طلب الرمز بعد{" "}
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        ({resendCooldown} ثانية)
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendCode()}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 font-bold text-[var(--clay-accent)] hover:underline"
                    >
                      <RefreshCw className="size-3.5" />
                      إعادة إرسال رمز التحقق الآن
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setOtp("");
                      setError(null);
                    }}
                    className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {method === "phone"
                      ? "تغيير رقم الجوال"
                      : "تغيير البريد الإلكتروني"}
                  </button>
                </div>
              </div>
            )}

            {/* فاصل */}
            {step === "input" && (
              <div className="pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground">أو</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-2xl text-sm font-medium hover:bg-muted"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="ml-2 size-4 text-muted-foreground" />
                    المتابعة كزائر سريع (تصفح واستكشاف)
                  </Button>

                  <div className="mt-2 text-center">
                    <Link
                      to={ownerMode ? "/auth" : "/auth?owner=1"}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-[var(--clay-accent)]"
                    >
                      <KeyRound className="size-3.5" />
                      {ownerMode
                        ? "الدخول كنزيل / زائر عادي"
                        : "هل أنت مالك شقة؟ تسجيل دخول المالكين"}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* تذييل الصفحة بالأمان والخصوصية */}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5 text-emerald-600" />
          <span>بياناتك ومصادقتك محمية بأحدث معايير التشفير والأمان.</span>
        </p>
      </div>
    </main>
  );
}
