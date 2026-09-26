import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { isAuthorizedAdmin } from "@/types/auth";
import { LayoutDashboard, LogOut, MessageSquare, Shield, Store, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const isAdmin = isAuthorizedAdmin(role, user?.email);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
      </div>
    </main>
  );
}
