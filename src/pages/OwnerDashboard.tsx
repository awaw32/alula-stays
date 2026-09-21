import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import {
  Home,
  Plus,
  Calendar,
  DollarSign,
  Star,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
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

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const myApartments = useQuery(api.admin.ownerApartments);
  const addApartment = () => navigate("/owner/add");
  const myBookings = useQuery(api.bookings.ownerBookings);
  const deleteApartment = useMutation(api.admin.deleteApartment);
  const [activeTab, setActiveTab] = useState<"apartments" | "bookings">("apartments");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشقة؟")) return;
    setDeleting(id);
    try {
      await deleteApartment({ apartmentId: id as any });
    } catch {
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setDeleting(null);
    }
  };

  const totalEarnings = myBookings
    ?.filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.totalPrice - b.platformFee), 0) || 0;

  const activeBookings = myBookings?.filter((b) => b.status === "confirmed" && b.checkOut > Date.now()) || [];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
            لوحة تحكم المالك
          </h1>
          <p className="text-[var(--muted-foreground)]">مرحباً {user?.name || "المالك"}</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-8">
          {[
            { icon: Home, label: "شققي", value: myApartments?.length || 0, color: "bg-blue-50 text-blue-600" },
            { icon: Calendar, label: "الحجوزات النشطة", value: activeBookings.length, color: "bg-emerald-50 text-emerald-600" },
            { icon: DollarSign, label: "الأرباح", value: `${totalEarnings.toLocaleString()} ر.س`, color: "bg-amber-50 text-amber-600" },
            { icon: Star, label: "متوسط التقييم", value: myApartments?.length ? (myApartments.reduce((s, a) => s + a.rating, 0) / myApartments.length).toFixed(1) : "0", color: "bg-purple-50 text-purple-600" },
          ].map((stat, i) => (
            <div key={stat.label} className="clay p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-[var(--foreground)]">{stat.value}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["apartments", "bookings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`clay-sm px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab ? "!bg-[var(--clay-accent)] !text-white" : "text-[var(--muted-foreground)]"
              }`}
            >
              {tab === "apartments" ? "شققي" : "الحجوزات"}
            </button>
          ))}
        </div>

        {/* Apartments Tab */}
        {activeTab === "apartments" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {myApartments === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : myApartments.length === 0 ? (
              <div className="clay p-12 text-center">
                <Home className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                <h3 className="font-bold text-lg mb-2">لا توجد شقق بعد</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">أضف شقتك الأولى للبدء</p>
                <button onClick={() => navigate("/owner/add")} className="clay-btn text-sm">إضافة شقة</button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApartments.map((apt) => (
                  <div key={apt._id} className="clay p-4 flex flex-col md:flex-row gap-4">
                    <img src={apt.images[0]} alt={apt.title} className="w-full md:w-32 h-24 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[var(--foreground)] truncate">{apt.title}</h3>
                        {apt.isVerified && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        {apt.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mb-2">{apt.location}</p>
                      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                        <span className="font-bold text-[var(--clay-accent)]">{apt.price.toLocaleString()} ر.س/ليلة</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{apt.rating}</span>
                        <span>{apt.bedrooms} غرف</span>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <button onClick={() => navigate(`/apartment/${apt._id}`)} className="clay-sm p-2 hover:bg-[var(--clay-accent-soft)] transition-colors"><Eye className="w-4 h-4 text-[var(--muted-foreground)]" /></button>
                      <button className="clay-sm p-2 hover:bg-[var(--clay-accent-soft)] transition-colors"><Edit className="w-4 h-4 text-[var(--muted-foreground)]" /></button>
                      <button onClick={() => handleDelete(apt._id)} disabled={deleting === apt._id} className="clay-sm p-2 hover:bg-red-50 transition-colors">
                        {deleting === apt._id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            {myBookings === undefined ? (
              <div className="clay p-6 animate-pulse h-40" />
            ) : myBookings.length === 0 ? (
              <div className="clay p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                <h3 className="font-bold text-lg mb-2">لا توجد حجوزات بعد</h3>
                <p className="text-sm text-[var(--muted-foreground)]">ستظهر الحجوزات هنا عندما يحجز ضيوف شققك</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <div key={booking._id} className="clay p-4 flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--foreground)] mb-1">{booking.apartment?.title || "شقة"}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(booking.checkIn).toLocaleDateString("ar-SA")} — {new Date(booking.checkOut).toLocaleDateString("ar-SA")}</span>
                        <span>{booking.totalNights} ليلة</span>
                        <span className="font-bold text-[var(--clay-accent)]">{booking.totalPrice.toLocaleString()} ر.س</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                        booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                        booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {booking.status === "confirmed" ? "مؤكد" :
                         booking.status === "pending" ? "قيد الانتظار" :
                         booking.status === "cancelled" ? "ملغى" : "مكتمل"}
                      </span>
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
