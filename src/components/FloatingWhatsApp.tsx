import React from "react";
import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp() {
  return (
    <aside aria-label="الدعم الفني عبر واتساب">
      <a
        href="https://wa.me/966535080498"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        className="fixed bottom-6 left-6 z-40 group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:-translate-y-0.5 transition-all duration-300 select-none cursor-pointer"
        dir="rtl"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <span className="text-xs sm:text-sm font-bold tracking-tight">
          تواصل معنا واتساب
        </span>
        <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" aria-hidden="true" />
      </a>
    </aside>
  );
}
