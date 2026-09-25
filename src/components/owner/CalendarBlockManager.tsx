import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { CalendarDays, Ban, Trash2, Loader2, Lock } from "lucide-react";

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" });
}

interface ApartmentLite {
  _id: string;
  title?: string;
  titleAr?: string;
  status?: string;
  isVerified?: boolean;
}

export function CalendarBlockManager({ apartments }: { apartments: ApartmentLite[] }) {
  const [selectedId, setSelectedId] = useState<string>(apartments[0]?._id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  const apartmentId = selectedId || undefined;

  const availability = useQuery(
    api.calendar.unavailableDates,
    apartmentId ? { apartmentId: apartmentId as Id<"apartments"> } : "skip",
  );
  const blockedList = useQuery(
    api.calendar.listBlocked,
    apartmentId ? { apartmentId: apartmentId as Id<"apartments"> } : "skip",
  );

  const blockDates = useMutation(api.calendar.blockDates);
  const unblockDates = useMutation(api.calendar.unblockDates);

  const unavailableSet = useMemo(
    () => new Set(availability?.unavailableDays ?? []),
    [availability],
  );

  // شبكة التقويم: 60 يوماً قادمة
  const [todayStart] = useState(() => startOfDay(Date.now()));
  const calendarDays = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const day = todayStart + i * DAY_MS;
      return {
        ts: day,
        unavailable: unavailableSet.has(day),
      };
    });
  }, [unavailableSet, todayStart]);

  const handleBlock = async () => {
    if (!apartmentId || !startDate || !endDate) return;
    setBlocking(true);
    try {
      const result = await blockDates({
        apartmentId: apartmentId as Id<"apartments">,
        startDate: new Date(`${startDate}T00:00:00`).getTime(),
        endDate: new Date(`${endDate}T00:00:00`).getTime(),
        reason: reason.trim() || undefined,
      });
      toast.success(result.message);
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر حجب التواريخ"));
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      await unblockDates({ blockId: blockId as Id<"blockedDates"> });
      toast.success("تم إلغاء الحجب");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر إلغاء الحجب"));
    }
  };

  if (apartments.length === 0) {
    return (
      <div className="clay p-8 text-center">
        <CalendarDays className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
        <h3 className="font-bold text-lg mb-1">لا توجد شقق بعد</h3>
        <p className="text-sm text-[var(--muted-foreground)]">أضف شقة أولاً لتتمكن من إدارة توفرها</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* اختيار الشقة */}
      <div className="clay p-4">
        <label htmlFor="calendar-apartment-select" className="block text-sm font-medium mb-2">
          اختر الشقة
        </label>
        <select
          id="calendar-apartment-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="clay-input w-full md:w-1/2"
        >
          {apartments.map((apt) => (
            <option key={apt._id} value={apt._id}>
              {apt.titleAr || apt.title}
            </option>
          ))}
        </select>
      </div>

      {/* شبكة التقويم: 60 يوماً */}
      <div className="clay p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          الأيام القادمة (60 يوماً)
        </h3>
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {calendarDays.map(({ ts, unavailable }) => (
            <div
              key={ts}
              title={`${new Date(ts).toLocaleDateString("ar-SA")}${unavailable ? " — غير متاح" : " — متاح"}`}
              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[9px] font-medium ${
                unavailable
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <span>{new Date(ts).getDate()}</span>
              <span>{new Date(ts).toLocaleDateString("en", { month: "short" })}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> متاح</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> محجوز أو محجوب</span>
        </div>
      </div>

      {/* حجب فترة */}
      <div className="clay p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Ban className="w-4 h-4" />
          حجب تواريخ (صيانة / استخدام شخصي)
        </h3>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="block-start" className="block text-xs text-[var(--muted-foreground)] mb-1">من</label>
            <input
              id="block-start"
              type="date"
              value={startDate}
              min={toDateInputValue(new Date())}
              onChange={(e) => setStartDate(e.target.value)}
              className="clay-input w-full"
            />
          </div>
          <div>
            <label htmlFor="block-end" className="block text-xs text-[var(--muted-foreground)] mb-1">إلى</label>
            <input
              id="block-end"
              type="date"
              value={endDate}
              min={startDate || toDateInputValue(new Date())}
              onChange={(e) => setEndDate(e.target.value)}
              className="clay-input w-full"
            />
          </div>
          <div>
            <label htmlFor="block-reason" className="block text-xs text-[var(--muted-foreground)] mb-1">السبب (اختياري)</label>
            <input
              id="block-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="صيانة، استخدام شخصي..."
              className="clay-input w-full"
            />
          </div>
          <button
            type="button"
            onClick={handleBlock}
            disabled={blocking || !startDate || !endDate}
            className="clay-btn px-4 py-2 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            حجب
          </button>
        </div>
      </div>

      {/* فترات الحجب الحالية */}
      <div className="clay p-4">
        <h3 className="font-bold mb-3">فترات الحجب الحالية</h3>
        {blockedList === undefined ? (
          <div className="h-16 animate-pulse bg-gray-100 rounded-xl" />
        ) : blockedList.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">لا توجد فترات محجوبة حالياً</p>
        ) : (
          <div className="space-y-2">
            {blockedList.map((block) => (
              <div key={block._id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatDate(block.startDate)} — {formatDate(block.endDate)}
                  </p>
                  {block.reason && (
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{block.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(block._id)}
                  className="clay-sm p-2 hover:bg-red-50 shrink-0"
                  aria-label="إلغاء الحجب"
                  title="إلغاء الحجب"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
