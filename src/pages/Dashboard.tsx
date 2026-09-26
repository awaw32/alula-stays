import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { isAuthorizedAdmin } from "@/types/auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";
import {
  Building2,
  Clock,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Shield,
  Store,
  UserRound,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const ownerStatus = useQuery(api.owners.myOwnerStatus, DEMO_MODE ? "skip" : undefined);

  const isAdmin = isAuthorizedAdmin(role, user?.email);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6" dir="rtl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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

        {/* تنبيه حالة طلب المالك إن وجد */}
        {ownerStatus?.status === "pending" && (
          <div className="clay p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--foreground)]">
                  تم رفع بياناتك للإدارة وسيتم قبول حسابك بأقرب وقت
                </h4>
                <p className="text-xs text-[var(--muted-foreground)]">
                  طلبك للانضمام كمالك عقار قيد المراجعة والاعتماد حالياً.
                </p>
              </div>
            </div>
            <Link
              to="/owner"
              className="clay-btn px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shrink-0"
            >
              متابعة حالة الطلب
            </Link>
          </div>
        )}

        {ownerStatus?.status === "rejected" && (
          <div className="clay p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-[var(--foreground)]">ملاحظة بخصوص طلب الانضمام كمالك عقار</h4>
                <p className="text-xs text-[var(--muted-foreground)]">يرجى مراجعة سبب عدم الاعتماد وإعادة تحديث البيانات.</p>
              </div>
            </div>
            <Link to="/owner" className="clay-sm px-4 py-2 text-xs font-bold shrink-0">
              عرض الملاحظة
            </Link>
          </div>
        )}

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard className="size-5" aria-hidden="true" />
            </div>
            <CardTitle>ماذا تريد أن تفعل اليوم؟</CardTitle>
            <CardDescription>أدر حجوزاتك أو استكشف الإقامات المتاحة في العلا.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Link to="/my-bookings" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]">
              <UserRound className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" />
              <span>حجوزاتي</span>
            </Link>
            <Link to="/messages" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]">
              <MessageSquare className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" />
              <span>المحادثات والرسائل</span>
            </Link>
            <Link to="/apartments" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]">
              <Store className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" />
              <span>تصفح الشقق</span>
            </Link>
            {(role === "owner" || isAdmin) && (
              <Link to="/owner" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]">
                <Store className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" />
                <span>لوحة المالك</span>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="clay-sm flex items-center gap-3 p-4 transition-colors hover:bg-[var(--clay-accent-soft)]">
                <Shield className="h-5 w-5 text-[var(--clay-accent)]" aria-hidden="true" />
                <span>لوحة الإدارة</span>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* دعوة للانضمام كمالك عقار للمستخدمين العاديين */}
        {role !== "owner" && !isAdmin && ownerStatus?.status === "none" && (
          <div className="clay p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>هل تملك شقة أو عقاراً في العلا؟</span>
              </h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                انضم إلى نخبة ملاك شقق العلا واستقبل الضيوف وحقق دخلاً إضافياً مع ضمان الدفع وإدارة متكاملة.
              </p>
            </div>
            <Link
              to="/owner"
              className="clay-btn px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shrink-0 shadow-sm"
            >
              تقديم طلب كمالك عقار
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
