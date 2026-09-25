import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import { Wallet, Landmark, Loader2, TrendingUp, Clock, CheckCircle2, Coins } from "lucide-react";

export function OwnerFinance() {
  const bankAccount = useQuery(api.payouts.myBankAccount);
  const earnings = useQuery(api.payouts.myEarnings);
  const payoutsList = useQuery(api.payouts.myPayouts);

  const [iban, setIban] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [saving, setSaving] = useState(false);

  const saveBankAccount = useMutation(api.payouts.saveBankAccount);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveBankAccount({
        iban,
        accountHolderName: holderName,
        bankName: bankName || undefined,
      });
      toast.success(result);
      setIban("");
      setHolderName("");
      setBankName("");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر حفظ البيانات البنكية"));
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => `${n.toLocaleString("ar-SA")} ر.س`;

  return (
    <div className="space-y-4">
      {/* الملخص المالي */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: Coins, label: "إجمالي الإيرادات", value: earnings ? fmt(earnings.grossRevenue) : "...", color: "bg-blue-50 text-blue-600" },
          { icon: TrendingUp, label: "صافي بعد العمولة", value: earnings ? fmt(earnings.netEarnings) : "...", color: "bg-emerald-50 text-emerald-600" },
          { icon: Wallet, label: "المتاح للتحويل", value: earnings ? fmt(earnings.available) : "...", color: "bg-amber-50 text-amber-600" },
          { icon: Clock, label: "تحويلات معلّقة", value: earnings ? fmt(earnings.pendingPayouts) : "...", color: "bg-purple-50 text-purple-600" },
          { icon: CheckCircle2, label: "تم تحويله", value: earnings ? fmt(earnings.transferred) : "...", color: "bg-teal-50 text-teal-600" },
          { icon: Coins, label: "عمولة المنصة", value: earnings ? fmt(earnings.platformFees) : "...", color: "bg-gray-50 text-gray-600" },
        ].map((card) => (
          <div key={card.label} className="clay p-4">
            <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center mb-2`}>
              <card.icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-lg font-bold text-[var(--foreground)]">{card.value}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{card.label}</div>
          </div>
        ))}
      </div>

      {/* البيانات البنكية */}
      <div className="clay p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Landmark className="w-4 h-4" />
          بيانات التحويل البنكي
        </h3>
        {bankAccount === undefined ? (
          <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <>
            {bankAccount && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3 text-sm">
                <p className="font-medium text-emerald-800">✓ الحساب مسجّل</p>
                <p className="text-emerald-700 mt-1" dir="ltr">{bankAccount.iban}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {bankAccount.accountHolderName}{bankAccount.bankName ? ` · ${bankAccount.bankName}` : ""}
                </p>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="iban-input" className="block text-xs text-[var(--muted-foreground)] mb-1">IBAN (سعودي)</label>
                <input
                  id="iban-input"
                  type="text"
                  dir="ltr"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder={bankAccount ? bankAccount.iban : "SA00 0000 0000 0000 0000 0000"}
                  className="clay-input w-full"
                />
              </div>
              <div>
                <label htmlFor="holder-input" className="block text-xs text-[var(--muted-foreground)] mb-1">اسم صاحب الحساب</label>
                <input
                  id="holder-input"
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder={bankAccount ? bankAccount.accountHolderName : "كما هو مسجّل في البنك"}
                  className="clay-input w-full"
                />
              </div>
              <div>
                <label htmlFor="bank-input" className="block text-xs text-[var(--muted-foreground)] mb-1">البنك (اختياري)</label>
                <input
                  id="bank-input"
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={bankAccount?.bankName || "الراجحي، الأهلي..."}
                  className="clay-input w-full"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !iban || !holderName}
              className="clay-btn px-4 py-2 text-sm mt-3 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
              {bankAccount ? "تحديث البيانات" : "حفظ البيانات"}
            </button>
          </>
        )}
      </div>

      {/* سجل التحويلات */}
      <div className="clay p-4">
        <h3 className="font-bold mb-3">سجل التحويلات</h3>
        {payoutsList === undefined ? (
          <div className="h-16 animate-pulse bg-gray-100 rounded-xl" />
        ) : payoutsList.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            لا توجد تحويلات بعد — تُحوَّل المستحقات بعد اكتمال الحجوزات المدفوعة
          </p>
        ) : (
          <div className="space-y-2">
            {payoutsList.map((payout) => (
              <div key={payout._id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{payout.amount.toLocaleString("ar-SA")} ر.س</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(payout.createdAt).toLocaleDateString("ar-SA")}
                    {payout.reference ? ` · مرجع: ${payout.reference}` : ""}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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
