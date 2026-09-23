/**
 * ملف شامل للمزايا المتقدمة
 * البحث المتقدم، التقارير، والإحصائيات
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 البحث والتصفية المتقدمة
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SEARCH_FILTERS = {
  // نطاقات الأسعار
  PRICE_RANGES: {
    budget: { min: 0, max: 500 },
    mid: { min: 500, max: 1500 },
    premium: { min: 1500, max: 5000 },
    luxury: { min: 5000, max: 999999 },
  },

  // التقييمات
  RATINGS: {
    excellent: 4.5,
    good: 3.5,
    average: 2.5,
    below_average: 0,
  },

  // المرافق
  AMENITIES: [
    "wifi",
    "ac",
    "kitchen",
    "parking",
    "pool",
    "gym",
    "balcony",
    "garden",
    "bbq",
    "washer",
  ],

  // أنواع الشقق
  APARTMENT_TYPES: [
    "studio",
    "one_bed",
    "two_bed",
    "three_bed",
    "villa",
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 التقارير والإحصائيات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BookingReport {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
}

export interface OwnerStats {
  totalApartments: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  responseRate: number;
  lastMonth: {
    bookings: number;
    revenue: number;
  };
}

export interface PlatformStats {
  totalUsers: number;
  totalApartments: number;
  totalBookings: number;
  totalRevenue: number;
  activeListings: number;
  monthlyGrowth: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 التوصيات والاقتراحات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ApartmentRecommendation {
  apartmentId: string;
  score: number; // 0-100
  reasons: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳 طرق الدفع الإضافية
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAYMENT_METHODS = {
  stripe: "stripe",
  applePay: "apple_pay",
  googlePay: "google_pay",
  bankTransfer: "bank_transfer",
  wallet: "wallet",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📧 قوالب البريد الإضافية
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_FAILED: "payment_failed",
  REVIEW_REMINDER: "review_reminder",
  MONTHLY_REPORT: "monthly_report",
  PROMOTION: "promotion",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 دعم العملات المحلية
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SUPPORTED_CURRENCIES = {
  SAR: { code: "SAR", name: "الريال السعودي", symbol: "﷼", rate: 1 },
  USD: { code: "USD", name: "الدولار الأمريكي", symbol: "$", rate: 0.27 },
  EUR: { code: "EUR", name: "اليورو", symbol: "€", rate: 0.25 },
  AED: { code: "AED", name: "درهم إماراتي", symbol: "د.إ", rate: 0.99 },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 Monitoring و Logging
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface LogEntry {
  timestamp: number;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  data?: any;
  userId?: string;
  context?: string;
}

export interface PerformanceMetrics {
  responseTime: number; // ms
  errorRate: number; // percentage
  successRate: number; // percentage
  activeUsers: number;
  totalRequests: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 النسخ الاحتياطية والاستعادة
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BackupConfig {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly";
  retention: number; // عدد النسخ المحفوظة
  location: string; // مكان التخزين
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 دعم لغات متعددة (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SUPPORTED_LANGUAGES = {
  ar: { name: "العربية", code: "ar", direction: "rtl" },
  en: { name: "English", code: "en", direction: "ltr" },
  fr: { name: "Français", code: "fr", direction: "ltr" },
  es: { name: "Español", code: "es", direction: "ltr" },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 SEO و Marketing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  imageUrl?: string;
  canonicalUrl?: string;
  ogType?: string;
}

export interface StructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  image?: string;
  aggregateRating?: {
    "@type": string;
    ratingValue: number;
    reviewCount: number;
  };
}

export default {
  SEARCH_FILTERS,
  PAYMENT_METHODS,
  EMAIL_TEMPLATES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
};
