import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation } from "convex/react";
import { DEMO_MODE } from "@/lib/demo-data";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/auth";
import { getApartmentLocation, getApartmentTitle } from "@/lib/apartment-content";
import { getErrorMessage } from "@/lib/error-message";
import { toast } from "sonner";
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Shield,
  TrendingUp,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const stats = useQuery(api.admin.adminDashboardStats, DEMO_MODE ? "skip" : undefined);
  const allApartments = useQuery(api.admin.allApartments, DEMO_MODE ? "skip" : undefined);
  const allUsers = useQuery(api.admin.allUsers, DEMO_MODE ? "skip" : undefined);
  const verifyApartment = useMutation(api.admin.adminVerifyApartment);
  const featureApartment = useMutation(api.admin.adminFeatureApartment);
  const updateRole = useMutation(api.admin.adminUpdateUserRole);
  const [activeTab, setActiveTab] = useState<"stats" | "apartments" | "users">("stats");

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await verifyApartment({ apartmentId: id as Id<"apartments">, verified });
      toast.success(verified ? "تم قبول الشقة ونشرها" : "تم رفض الشقة وإخفاؤها من الموقع");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث حالة التوثيق"));
    }
  };

  const handleFeature = async (id: string, featured: boolean) => {
    try {
      await featureApartment({ apartmentId: id as Id<"apartments">, featured });
      toast.success(featured ? "تم تمييز الشقة" : "تم إلغاء تمييز الشقة");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث الشقة"));
    }
  };

  const handleRoleChange = async (id: string, role: UserRole) => {
    try {
      await updateRole({ userId: id as Id<"users">, role });
      toast.success("تم تحديث دور المستخدم");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تحديث دور المستخدم"));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">لوحة التحكم الإدارية</h1>
              <p className="text-sm text-[var(--muted-foreground)]">مرحباً {user?.name || "المدير"}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-8">
            {[
              { icon: Users, label: "المستخدمون", value: stats.totalUsers, color: "bg-blue-50 text-blue-600" },
              { icon: Home, label: "الشقق", value: stats.totalApartments, color: "bg-emerald-50 text-emerald-600" },
              { icon: Calendar, label: "الحجوزات", value: stats.totalBookings, color: "bg-purple-50 text-purple-600" },
              { icon: DollarSign, label: "إيرادات المنصة", value: `${stats.platformRevenue.toLocaleString()} ر.س`, color: "bg-amber-50 text-amber-600" },
              { icon: TrendingUp, label: "الحجوزات الشهر", value: stats.monthlyBookings, color: "bg-pink-50 text-pink-600" },
              { icon: Star, label: "متوسط التقييم", value: stats.avgRating, color: "bg-yellow-50 text-yellow-600" },
              { icon: AlertCircle, label: "بانتظار التوثيق", value: stats.pendingVerification, color: "bg-orange-50 text-orange-600" },
              { icon: Eye, label: "التقييمات", value: stats.totalReviews, color: "bg-teal-50 text-teal-600" },
            ].map((stat) => (
              <div key={stat.label} className="clay p-4">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-2`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-[var(--foreground)]">{stat.value}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2" role="tablist" aria-label="أقسام لوحة الإدارة">
          {(["stats", "apartments", "users"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`clay-sm px-5 py-2.5 text-sm font-medium transition-all ${activeTab === tab ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"}`}
            >
              {tab === "stats" ? "نظرة عامة" : tab === "apartments" ? "الشقق" : "المستخدمون"}
            </button>
          ))}
        </div>

        {/* Apartments Management */}
        {activeTab === "apartments" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {allApartments === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : (
              <div className="space-y-3">
                {allApartments.map((apt) => (
                  <div key={apt._id} className="clay p-4 flex flex-col md:flex-row gap-4 items-start">
                      <img src={apt.images[0]} alt={getApartmentTitle(apt)} className="w-full md:w-24 h-20 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--foreground)] truncate">{getApartmentTitle(apt)}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{getApartmentLocation(apt)} · {apt.price.toLocaleString("ar-SA")} ر.س/ليلة</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => handleVerify(apt._id, !apt.isVerified)} className={`clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${apt.isVerified ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`} aria-label={apt.isVerified ? "رفض الشقة وإخفاؤها" : "قبول الشقة ونشرها"}>
                        {apt.isVerified ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {apt.isVerified ? "رفض" : "قبول"}
                      </button>
                      <button type="button" onClick={() => handleFeature(apt._id, !apt.isFeatured)} className={`clay-sm flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${apt.isFeatured ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`} aria-label={apt.isFeatured ? "إلغاء تمييز الشقة" : "تمييز الشقة"}>
                        <Star className={`w-3.5 h-3.5 ${apt.isFeatured ? "fill-amber-400" : ""}`} />
                        {apt.isFeatured ? "مميزة" : "تمييز"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Users Management */}
        {activeTab === "users" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {allUsers === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : (
              <div className="space-y-3">
                {allUsers.map((u) => (
                  <div key={u._id} className="clay p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--clay-accent-soft)] flex items-center justify-center text-sm font-bold text-[var(--clay-accent)] shrink-0">
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--foreground)]">{u.name || "بدون اسم"}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{u.email || "بدون بريد"}</p>
                    </div>
                    <div className="shrink-0">
                      <select value={u.role || "user"} onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)} className="clay-input px-3 py-1.5 text-xs" aria-label={`دور ${u.name || u.email || "المستخدم"}`}>
                        <option value="user">مستخدم</option>
                        <option value="owner">مالك</option>
                        <option value="member">عضو</option>
                        <option value="admin">مدير</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
