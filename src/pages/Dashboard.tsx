import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, LogOut, MessageSquare, Shield, ShieldAlert, Store, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";
import { toast } from "sonner";
import { useState } from "react";

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const hasAdmin = useQuery(api.users.hasAdmin, DEMO_MODE ? "skip" : {});
  const claimAdmin = useMutation(api.users.claimFirstAdmin);
  const [claiming, setClaiming] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleClaimFirstAdmin = async () => {
    setClaiming(true);
    try {
      await claimAdmin();
      toast.success("تم ترقية حسابك كمدير للمنصة بنجاح!");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تعيين المدير");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">مساحتك في شقق العلا</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">مرحباً{user?.name ? `، ${user.name}` : " بك"}</h1>
          </div>
          <Button type="button" variant="outline" className="cursor-pointer gap-2 self-start" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden="true" />
            تسجيل الخروج
          </Button>
        </header>

        {/* تنبيه تعيين أول مدير إذا لم يكن هناك أي مدير مسجل */}
        {hasAdmin === false && (
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-6 dark:border-amber-700/50 dark:bg-amber-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950 dark:text-amber-100">تهيئة إدارة المنصة (أول مدير)</h3>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                    لا يوجد أي مدير مسجل في قاعدة البيانات حتى الآن. يمكنك تعيين هذا الحساب كمدير رئيسي للمنصة للدخول إلى لوحة التحكم الإدارية.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleClaimFirstAdmin}
                disabled={claiming}
                className="shrink-0 bg-amber-600 font-bold text-white hover:bg-amber-700"
              >
                {claiming ? "جارٍ التعيين..." : "تعيين نفسي كأول مدير"}
              </Button>
            </div>
          </div>
        )}

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><LayoutDashboard className="size-5" aria-hidden="true" /></div>
            <CardTitle>ماذا تريد أن تفعل اليوم؟</CardTitle>
            <CardDescription>أدر حجوزاتك أو استكشف الإقامات المتاحة في العلا.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Link to="/my-bookings" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]"><UserRound className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" /><span>حجوزاتي</span></Link>
            <Link to="/messages" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]"><MessageSquare className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" /><span>المحادثات والرسائل</span></Link>
            <Link to="/apartments" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]"><Store className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" /><span>تصفح الشقق</span></Link>
            {(role === "owner" || role === "admin") && <Link to="/owner" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]"><Store className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" /><span>لوحة المالك</span></Link>}
            {role === "admin" && <Link to="/admin" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]"><Shield className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" /><span>لوحة الإدارة</span></Link>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
