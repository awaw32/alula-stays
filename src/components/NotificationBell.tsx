import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bell, CheckCheck, ExternalLink, Calendar, CheckCircle2, Clock, AlertTriangle, Sparkles, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = useQuery(api.notifications.getUnreadCount) ?? 0;
  const notifications = useQuery(api.notifications.getUserNotifications, { limit: 15 });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: {
    _id: Id<"notifications">;
    read: boolean;
    actionUrl?: string;
  }) => {
    if (!notif.read) {
      try {
        await markAsRead({ notificationId: notif._id });
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking_created":
      case "booking_paid":
      case "payment_confirmed":
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "apartment_status_changed":
      case "apartment_pending_review":
        return <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "owner_application_approved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "owner_application_submitted":
      case "owner_request_pending":
        return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "booking_cancelled":
      case "owner_application_rejected":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-[var(--clay-accent)]" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  return (
    <div className={cn("relative inline-block text-right", className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors focus:outline-hidden"
        aria-label="الإشعارات"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#1E1610] shadow-2xl border border-neutral-200/80 dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                الإشعارات والتنبيهات
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#542382] dark:bg-purple-950/60 dark:text-purple-300">
                  {unreadCount} جديد
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="text-[11px] font-bold text-[#542382] dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {notifications === undefined ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-[#542382] border-t-transparent rounded-full mb-2" />
                <p>جارٍ تحميل الإشعارات...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 dark:text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">لا توجد إشعارات حالياً</p>
                <p className="text-[10px] mt-1 opacity-70">ستصلك هنا تنبيهات الحجوزات والاعتمادات أولاً بأول</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => void handleNotificationClick(notif)}
                  className={cn(
                    "p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-right",
                    !notif.read && "bg-purple-50/40 dark:bg-purple-950/15"
                  )}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={cn("text-xs font-bold truncate", !notif.read ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-300")}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.actionUrl && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-[#542382] dark:text-purple-400">
                        <span>عرض التفاصيل</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[#542382] shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-center">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              الانتقال للوحة التحكم وإدارة الحساب
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
