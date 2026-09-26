import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, CheckCircle, Clock, XCircle, ShieldCheck, Download } from "lucide-react";

export interface InvoiceData {
  invoiceNumber: string;
  bookingId: string;
  status: string;
  paymentStatus: string;
  apartmentTitle: string;
  apartmentLocation?: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  ownerName?: string;
  ownerPhone?: string;
  checkIn: number;
  checkOut: number;
  totalNights: number;
  guests: number;
  pricePerNight?: number;
  totalPrice: number;
  platformFee: number;
  paymentSessionId?: string;
  paidAt?: number;
  createdAt: number;
}

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
}

export function InvoiceModal({ open, onOpenChange, invoice }: InvoiceModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.paymentStatus === "paid" || invoice.status === "confirmed";
  const isCancelled = invoice.status === "cancelled" || invoice.paymentStatus === "refunded";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:m-0 print:p-0 bg-[var(--background)] border border-[var(--border)]">
        <DialogHeader className="print:hidden flex flex-row items-center justify-between pb-2 border-b border-[var(--border)]">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span>فاتورة الحجز الإلكترونية</span>
            <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[var(--muted-foreground)]">
              #{invoice.invoiceNumber}
            </span>
          </DialogTitle>
          <button
            onClick={handlePrint}
            className="clay-sm px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--clay-accent-soft)]"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة / حفظ PDF
          </button>
        </DialogHeader>

        {/* Invoice Printable Sheet */}
        <div className="p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm print:border-none print:shadow-none print:p-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--clay-accent)] to-[var(--clay-gold)] flex items-center justify-center text-white font-bold text-sm">
                  عُ
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">شقق العلا</h2>
              </div>
              <p className="text-xs text-zinc-500">منصة حجز الشقق والوحدات السكنية في العلا</p>
              <p className="text-xs text-zinc-400">سجل تجاري / ترخيص رقمي معتمد</p>
            </div>

            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                {isPaid ? (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> مسددة ومؤكدة
                  </span>
                ) : isCancelled ? (
                  <span className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> ملغية / مستردة
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> بانتظار السداد
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-500">رقم الفاتورة: <strong className="text-zinc-800 dark:text-zinc-200">{invoice.invoiceNumber}</strong></p>
              <p className="text-xs text-zinc-500">تاريخ الإصدار: {new Date(invoice.createdAt).toLocaleDateString("ar-SA")}</p>
              {invoice.paidAt && (
                <p className="text-xs text-zinc-500">تاريخ السداد: {new Date(invoice.paidAt).toLocaleDateString("ar-SA")}</p>
              )}
              {invoice.paymentSessionId && (
                <p className="text-[11px] font-mono text-zinc-400">مرجع Tap: {invoice.paymentSessionId}</p>
              )}
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-2 gap-6 pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800 text-sm">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">بيانات العميل / الضيف</h3>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{invoice.guestName || "ضيف العلا"}</p>
              {invoice.guestPhone && <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">الجوال: {invoice.guestPhone}</p>}
              {invoice.guestEmail && <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">البريد: {invoice.guestEmail}</p>}
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">بيانات الوحدة والمستضيف</h3>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{invoice.apartmentTitle}</p>
              {invoice.apartmentLocation && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">الموقع: {invoice.apartmentLocation}</p>
              )}
              {invoice.ownerName && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">المضيف: {invoice.ownerName} {invoice.ownerPhone ? `(${invoice.ownerPhone})` : ""}</p>
              )}
            </div>
          </div>

          {/* Stay Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">تفاصيل الإقامة والحجز</h3>
            <div className="grid grid-cols-4 gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg text-center text-xs">
              <div>
                <span className="text-zinc-500 block">تاريخ الوصول</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{new Date(invoice.checkIn).toLocaleDateString("ar-SA")}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">تاريخ المغادرة</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{new Date(invoice.checkOut).toLocaleDateString("ar-SA")}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">عدد الليالي</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{invoice.totalNights} ليالٍ</span>
              </div>
              <div>
                <span className="text-zinc-500 block">عدد الضيوف</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{invoice.guests} ضيوف</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">تفاصيل الرسوم والمبالغ</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                  <th className="text-right py-2">الوصف</th>
                  <th className="text-center py-2">الكمية</th>
                  <th className="text-left py-2">المبلغ (ر.س)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                <tr>
                  <td className="py-2.5">
                    إقامة في {invoice.apartmentTitle}
                  </td>
                  <td className="text-center py-2.5">{invoice.totalNights} ليلة</td>
                  <td className="text-left py-2.5 font-medium">{invoice.totalPrice.toLocaleString()} ر.س</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-zinc-500 text-xs">
                    رسوم خدمة المنصة والضريبة المضافة
                  </td>
                  <td className="text-center py-2.5 text-zinc-400 text-xs">شاملة</td>
                  <td className="text-left py-2.5 text-zinc-500 text-xs">{invoice.platformFee.toLocaleString()} ر.س</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-300 dark:border-zinc-700">
                  <th colSpan={2} className="text-right py-3 text-base font-bold">المجموع الإجمالي المستحق</th>
                  <th className="text-left py-3 text-base font-bold text-[var(--clay-accent)]">
                    {(invoice.totalPrice + invoice.platformFee).toLocaleString()} ر.س
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment & Security Badge */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                عملية سداد إلكترونية آمنة ومشفرة عبر <strong>Tap Payments</strong> (مدى / Apple Pay).
              </span>
            </div>
            <span className="font-semibold text-[11px] uppercase tracking-wider">مدفوع ومحمي 3DS</span>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 text-center text-[11px] text-zinc-400">
            <p>فاتورة إلكترونية صادرة تلقائياً من منصة شقق العلا (soqaqalaula.world).</p>
            <p className="mt-0.5">شكراً لاختياركم شقق العلا، نتمنى لكم إقامة ممتعة وسعيدة في واحة العلا التاريخية.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
