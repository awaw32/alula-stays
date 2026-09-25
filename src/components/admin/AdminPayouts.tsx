import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import {
  Landmark,
  Loader2,
  Banknote,
  FileText,
  User as UserIcon,
} from "lucide-react";

interface UserLite {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

/**
 * تبويب الإدارة المالية للأدمن:
 * تسجيل تحويل مستحقات لمالك (اختيار المالك، المبلغ، المرجع) + قائمة التحويلات.
 */
export function AdminPayouts({ users }: { users: UserLite[] }) {
  const accounts = useQuery(api.payouts.adminAllAccounts, {});
  const payoutsList = useQuery(api.payouts.adminAllPayouts, {});
  const recordPayout = useMutation(api.payouts.adminRecordPayout);

  const [ownerId, setOwnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const owners = users.filter((u) => u.role === "owner" || u.role === "admin");
  const ownerName = (id: string) => {
    const u = users.find((x) => x._id === id);
    return u?.name || u?.email || "مالك";
  };
  const accountFor = (id: string) => accounts?.find((a) => a.ownerId === id);

  const handleSubmit = async () => {
    if (!ownerId || !amount) return;
    setSubmitting(true);
    try {
      const result = await recordPayout({
        ownerId: ownerId as never,
        amount: Number(amount),
        method: "manual_transfer",
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      toast.success(result.message);
      setOwnerId("");
      setAmount("");
      setReference("");
      setNote("");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر تسجيل التحويل"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* نموذج تسجيل تحويل */}
      <div className="clay p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Banknote className="w-4 h-4" />
          تسجيل تحويل مستحقات
        </h3>
        {owners.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">لا يوجد مالكو عقارات بعد</p>
        ) : (
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label htmlFor="payout-owner" className="block text-xs text-[var(--muted-foreground)] mb-1">
                المالك
              </label>
              <select
                id="payout-owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="clay-input w-full"
              >
                <option value="">— اختر المالك —</option>
                {owners.map((u) => {
                  const acc = accountFor(u._id);
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name || u.email}{acc ? ` · IBAN مسجّل` : ` · بلا بيانات بنكية`}
                    </option>
                  );
                })}
              </select>
              {ownerId && accountFor(ownerId) && (
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1" dir="ltr">
                  {accountFor(ownerId)?.iban} — {accountFor(ownerId)?.accountHolderName}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="payout-amount" className="block text-xs text-[var(--muted-foreground)] mb-1">
                المبلغ (ر.س)
              </label>
              <input
                id="payout-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="clay-input w-full"
              />
            </div>
            <div>
              <label htmlFor="payout-ref" className="block text-xs text-[var(--muted-foreground)] mb-1">
                رقم المرجع (اختياري)
              </label>
              <input
                id="payout-ref"
                type="text"
                dir="ltr"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="clay-input w-full"
              />
            </div>
          </div>
        )}
        {ownerId && !accountFor(ownerId) && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
            ⚠️ هذا المالك لم يضف بياناته البنكية بعد — لا يمكن تسجيل التحويل حتى يضيف IBAN من لوحته
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !ownerId || !amount || Number(amount) <= 0}
          className="clay-btn px-4 py-2 text-sm mt-3 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
          تسجيل التحويل
        </button>
      </div>

      {/* قائمة التحويلات */}
      <div className="clay p-4">
        <h3 className="font-bold mb-3">سجل التحويلات</h3>
        {payoutsList === undefined ? (
          <div className="h-16 animate-pulse bg-gray-100 rounded-xl" />
        ) : payoutsList.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">لا توجد تحويلات مسجّلة بعد</p>
        ) : (
          <div className="space-y-2">
            {payoutsList.map((payout) => (
              <div key={payout._id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    {ownerName(payout.ownerId)} — {payout.amount.toLocaleString("ar-SA")} ر.س
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    {new Date(payout.createdAt).toLocaleDateString("ar-SA")}
                    {payout.reference ? ` · مرجع: ${payout.reference}` : ""}
                    {payout.note ? ` · ${payout.note}` : ""}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                  payout.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                  payout.status === "pending" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {payout.status === "completed" ? "منفّذ" : payout.status === "pending" ? "معلّق" : "فاشل"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
