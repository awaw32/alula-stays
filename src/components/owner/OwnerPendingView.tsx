import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import {
  Clock,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  Building2,
  Calendar,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { OwnerApplicationForm } from "./OwnerApplicationForm";

interface OwnerPendingViewProps {
  application: {
    fullName: string;
    phone: string;
    city: string;
    propertyTypes?: string;
    propertyCount?: number;
    notes?: string;
    createdAt: number;
    status: string;
  };
}

export function OwnerPendingView({ application }: OwnerPendingViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div>
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="clay-sm inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لصفحة حالة الطلب</span>
          </button>
        </div>
        <OwnerApplicationForm
          initialName={application.fullName}
          initialPhone={application.phone}
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const formattedDate = new Date(application.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6" dir="rtl">
      {/* بطاقة الحالة الترحيبية الأساسية */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="clay p-6 sm:p-10 text-center relative overflow-hidden mb-8 border border-amber-500/20"
      >
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
          <span>طلبك قيد المراجعة والاعتماد</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight mb-3">
          تم رفع بياناتك للإدارة وسيتم قبول حسابك بأقرب وقت
        </h1>

        <p className="text-sm text-[var(--muted-foreground)] max-w-lg mx-auto leading-relaxed">
          شكراً لرغبتك بالانضمام إلى نخبة مضيفي وملاك شقق العلا. تم تسجيل بياناتك بنجاح
          ويقوم فريق الإدارة بمراجعتها للتحقق واعتماد دورك كمالك عقار. فور الموافقة ستفتح
          لك لوحة المالك لإضافة شققك واستقبال الحجوزات مباشرة.
        </p>

        {/* مراحل تفعيل الحساب */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-[var(--border)] text-right">
          <div className="clay-sm p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
            <div className="flex items-center gap-2 mb-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. رفع البيانات</span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">تم تسجيل طلبك وتوثيقه بنجاح</p>
          </div>

          <div className="clay-sm p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border-amber-500/40">
            <div className="flex items-center gap-2 mb-1 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Clock className="w-4 h-4 animate-spin" />
              <span>2. مراجعة الإدارة</span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">جاري تدقيق البيانات حالياً</p>
          </div>

          <div className="clay-sm p-3.5 opacity-60">
            <div className="flex items-center gap-2 mb-1 text-[var(--foreground)] font-bold text-xs">
              <Sparkles className="w-4 h-4 text-[var(--clay-accent)]" />
              <span>3. فتح لوحة المالك</span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">إضافة الشقق واستقبال الزوار</p>
          </div>
        </div>
      </motion.div>

      {/* تفاصيل الطلب المقدم */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay p-6 sm:p-7 mb-6"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
          <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--clay-accent)]" />
            <span>بيانات الطلب المسجلة</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="clay-sm px-2.5 py-1 text-xs text-[var(--clay-accent)] flex items-center gap-1 hover:bg-[var(--clay-accent-soft)]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل البيانات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--clay-surface)]">
            <User className="w-4 h-4 text-[var(--muted-foreground)]" />
            <div>
              <span className="text-[var(--muted-foreground)] block text-[10px]">الاسم الكامل:</span>
              <span className="font-bold text-[var(--foreground)]">{application.fullName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--clay-surface)]">
            <Phone className="w-4 h-4 text-[var(--muted-foreground)]" />
            <div>
              <span className="text-[var(--muted-foreground)] block text-[10px]">رقم الجوال:</span>
              <span className="font-bold text-[var(--foreground)]" dir="ltr">
                {application.phone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--clay-surface)]">
            <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" />
            <div>
              <span className="text-[var(--muted-foreground)] block text-[10px]">المدينة / الموقع:</span>
              <span className="font-bold text-[var(--foreground)]">{application.city}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--clay-surface)]">
            <Building2 className="w-4 h-4 text-[var(--muted-foreground)]" />
            <div>
              <span className="text-[var(--muted-foreground)] block text-[10px]">عدد الوحدات المتوقعة:</span>
              <span className="font-bold text-[var(--foreground)]">
                {application.propertyCount ?? 1} وحدة
              </span>
            </div>
          </div>

          {application.propertyTypes && (
            <div className="sm:col-span-2 p-2 rounded-xl bg-[var(--clay-surface)]">
              <span className="text-[var(--muted-foreground)] block text-[10px] mb-1">
                أنواع الوحدات:
              </span>
              <span className="font-bold text-[var(--foreground)]">
                {application.propertyTypes}
              </span>
            </div>
          )}

          {application.notes && (
            <div className="sm:col-span-2 p-2 rounded-xl bg-[var(--clay-surface)]">
              <span className="text-[var(--muted-foreground)] block text-[10px] mb-1">
                ملاحظات ونبذة:
              </span>
              <span className="text-[var(--foreground)]">{application.notes}</span>
            </div>
          )}

          <div className="sm:col-span-2 flex items-center gap-2 text-[11px] text-[var(--muted-foreground)] pt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>تاريخ تقديم الطلب: {formattedDate}</span>
          </div>
        </div>
      </motion.div>

      {/* خيارات المساعدة والتواصل السريع */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <a
          href="https://wa.me/966506709265?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D9%82%D9%85%D8%AA%20%D8%A8%D8%B1%D9%81%D8%B9%20%D8%B7%D9%84%D8%A8%20%D8%A7%D9%86%D8%B6%D9%85%D8%A7%D9%85%20%D9%83%D9%85%D8%A7%D9%84%D9%83%20%D8%B9%D9%82%D8%A7%D8%B1%20%D9%81%D9%8A%20%D8%B4%D9%82%D9%82%20%D8%A7%D9%84%D8%B9%D9%84%D8%A7%20%D9%88%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D9%84%D8%AA%D8%A3%D9%83%D9%8A%D8%AF"
          target="_blank"
          rel="noopener noreferrer"
          className="clay-btn w-full sm:w-auto px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <MessageCircle className="w-4 h-4" />
          <span>تواصل مع الإدارة عبر واتساب لتسريع التفعيل</span>
        </a>

        <Link
          to="/apartments"
          className="clay-sm w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-center text-[var(--foreground)] hover:bg-[var(--clay-accent-soft)]"
        >
          <span>تصفح شقق العلا كزائر</span>
        </Link>
      </div>
    </div>
  );
}
