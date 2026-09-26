import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEMO_MODE } from "@/lib/demo-data";
import { InvoiceModal, type InvoiceData } from "@/components/InvoiceModal";
import { Search, FileText, CheckCircle, Clock, XCircle, Printer, Download, Eye, Phone, Mail } from "lucide-react";

export function AdminInvoices() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  const invoices = useQuery(
    api.admin.adminInvoicesList,
    DEMO_MODE ? "skip" : { status: filterStatus, search: searchTerm }
  );

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)]">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="تصفية الفواتير">
          {[
            { id: "all", label: "كافة الفواتير" },
            { id: "paid", label: "المسددة والمكتملة" },
            { id: "unpaid", label: "المعلقة وغير المسددة" },
            { id: "cancelled", label: "الملغية والمستردة" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === tab.id
                  ? "bg-[var(--clay-accent)] text-white shadow-sm"
                  : "bg-[var(--clay-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الفاتورة، الضيف، الجوال..."
            className="clay-input pr-9 pl-3 py-1.5 text-xs w-full"
          />
        </div>
      </div>

      {/* Invoices List */}
      {invoices === undefined ? (
        <div className="space-y-3">
          <div className="clay h-20 animate-pulse" />
          <div className="clay h-20 animate-pulse" />
          <div className="clay h-20 animate-pulse" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="clay p-12 text-center text-zinc-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
          <h3 className="font-bold text-base text-[var(--foreground)]">لا توجد فواتير مطابقة</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">جرّب تغيير خيارات البحث أو التصفية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const isPaid = inv.paymentStatus === "paid" || inv.status === "confirmed";
            const isCancelled = inv.status === "cancelled" || inv.paymentStatus === "refunded";

            return (
              <div
                key={inv._id}
                className="clay p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Invoice Core Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono font-bold text-sm text-[var(--clay-accent)]">
                      #{inv.invoiceNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isPaid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : isCancelled
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> مسددة
                        </>
                      ) : isCancelled ? (
                        <>
                          <XCircle className="w-3 h-3" /> ملغية / مستردة
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> بانتظار السداد
                        </>
                      )}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {new Date(inv.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>

                  {/* Apartment & Dates */}
                  <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                    {inv.apartmentTitle} · <span className="text-[var(--muted-foreground)]">{inv.apartmentLocation}</span>
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    الإقامة: {new Date(inv.checkIn).toLocaleDateString("ar-SA")} إلى {new Date(inv.checkOut).toLocaleDateString("ar-SA")} ({inv.totalNights} ليالٍ) · المضيف: {inv.ownerName}
                  </p>

                  {/* Guest Contact Details */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs bg-zinc-50 dark:bg-zinc-900/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">العميل: {inv.guestName}</span>
                    {inv.guestPhone && (
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-emerald-600" /> {inv.guestPhone}
                      </span>
                    )}
                    {inv.guestEmail && (
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-blue-600" /> {inv.guestEmail}
                      </span>
                    )}
                    {inv.paymentSessionId && (
                      <span className="text-zinc-400 font-mono text-[10px] hidden sm:inline">
                        Tap ID: {inv.paymentSessionId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amounts & Action Button */}
                <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                  <div className="text-left">
                    <div className="text-base font-bold text-[var(--foreground)]">
                      {(inv.totalPrice + inv.platformFee).toLocaleString()} ر.س
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      عمولة المنصة: +{inv.platformFee.toLocaleString()} ر.س
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      مستحق المالك: {inv.ownerNet.toLocaleString()} ر.س
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedInvoice({
                        invoiceNumber: inv.invoiceNumber,
                        bookingId: inv.bookingId,
                        status: inv.status,
                        paymentStatus: inv.paymentStatus,
                        apartmentTitle: inv.apartmentTitle,
                        apartmentLocation: inv.apartmentLocation,
                        guestName: inv.guestName,
                        guestPhone: inv.guestPhone,
                        guestEmail: inv.guestEmail,
                        ownerName: inv.ownerName,
                        ownerPhone: inv.ownerPhone,
                        checkIn: inv.checkIn,
                        checkOut: inv.checkOut,
                        totalNights: inv.totalNights,
                        guests: inv.guests,
                        pricePerNight: inv.pricePerNight,
                        totalPrice: inv.totalPrice,
                        platformFee: inv.platformFee,
                        paymentSessionId: inv.paymentSessionId,
                        paidAt: inv.paidAt,
                        createdAt: inv.createdAt,
                      })
                    }
                    className="clay-sm px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--clay-accent-soft)]"
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--clay-accent)]" />
                    عرض الفاتورة الرسمية
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
