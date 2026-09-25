import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { DEMO_MODE } from "@/lib/demo-data";
import { getErrorMessage } from "@/lib/error-message";
import { api } from "../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { BadgeCheck, Loader2, MapPin, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

export default function OwnerProfile() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const profile = useQuery(api.users.myProfile, DEMO_MODE ? "skip" : undefined);
  const myUpdateProfile = useMutation(api.users.updateProfile);
  const becomeOwner = useMutation(api.users.becomeOwner);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
      setCountry(profile.country || "");
    }
  }, [profile]);

  // ترقية تلقائية إلى "مالك" عند دخول مستخدم عادي من بوابة المالك
  useEffect(() => {
    if (role && role !== "owner" && role !== "admin") {
      becomeOwner().catch(() => {});
    }
  }, [role, becomeOwner]);

  // المالك الذي أكمل ملفه يُحوَّل إلى لوحة المالك
  if (profile && role && (role === "owner" || role === "admin") && profile.phone) {
    return <Navigate to="/owner" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await myUpdateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
      });
      toast.success("تم حفظ بياناتك");
      navigate("/owner");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر حفظ البيانات"));
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 pb-12 pt-8 sm:px-6">
        <Card className="border shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] text-white">
              <BadgeCheck className="size-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl">بيانات مالك العقار</CardTitle>
            <CardDescription>
              أهلاً بك — أكمل بياناتك وسجّل الدخول لتتمكن من إضافة شقتك والبدء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="name">
                  <UserRound className="ml-1 inline h-4 w-4" aria-hidden="true" />
                  الاسم الكامل *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="clay-input mt-1 w-full"
                  placeholder="مثال: عبدالله العلا"
                  dir="rtl"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="phone">
                  <Phone className="ml-1 inline h-4 w-4" aria-hidden="true" />
                  رقم الجوال (للتواصل معك) *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="clay-input mt-1 w-full"
                  placeholder="05xxxxxxxx"
                  dir="rtl"
                  required
                  disabled={saving}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">
                    <MapPin className="ml-1 inline h-4 w-4" aria-hidden="true" />
                    المدينة
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="clay-input mt-1 w-full"
                    placeholder="العلا"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="country">البلد</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="clay-input mt-1 w-full"
                    placeholder="السعودية"
                    disabled={saving}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="clay-btn w-full py-3 text-lg">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
                {saving ? "جاري الحفظ..." : "حفظ والذهاب إلى لوحة المالك"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}