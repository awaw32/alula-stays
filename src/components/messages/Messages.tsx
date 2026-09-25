import { useEffect } from "react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-message";
import {
  MessageCircle,
  Send,
  Loader2,
  Lock,
  ShieldCheck,
  Phone,
} from "lucide-react";

export function MessagesPage({ initialConversationId }: { initialConversationId?: string }) {
  const conversations = useQuery(api.messages.myConversations, {});
  const [activeId, setActiveId] = useState<Id<"conversations"> | null>(
    (initialConversationId as Id<"conversations">) ?? null,
  );

  if (conversations === undefined) {
    return <div className="clay p-6 animate-pulse h-64" />;
  }

  if (conversations.length === 0) {
    return (
      <div className="clay p-8 text-center">
        <MessageCircle className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
        <h3 className="font-bold text-lg mb-1">لا توجد محادثات بعد</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          اضغط "مراسلة المالك" في صفحة أي شقة لبدء محادثة
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4">
      <div className="clay p-3 space-y-1.5 h-fit max-h-[70vh] overflow-y-auto">
        {conversations.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => setActiveId(c._id)}
            className={`w-full text-right rounded-xl px-3 py-2.5 transition-colors ${
              activeId === c._id ? "bg-[var(--clay-accent)] text-white" : "hover:bg-[var(--clay-accent-soft)]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">
                {c.role === "owner" ? c.otherName : c.apartmentTitle}
              </span>
              {c.unreadCount > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                  activeId === c._id ? "bg-white text-[var(--clay-accent)]" : "bg-red-500 text-white"
                }`}>
                  {c.unreadCount}
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 truncate ${activeId === c._id ? "text-white/70" : "text-[var(--muted-foreground)]"}`}>
              {c.lastMessagePreview ?? "—"}
            </p>
          </button>
        ))}
      </div>

      {activeId ? (
        <ConversationView conversationId={activeId} />
      ) : (
        <div className="clay p-8 hidden md:flex items-center justify-center text-[var(--muted-foreground)] text-sm">
          اختر محادثة من القائمة
        </div>
      )}
    </div>
  );
}

function ConversationView({ conversationId }: { conversationId: Id<"conversations"> }) {
  const data = useQuery(api.messages.list, { conversationId });
  const markRead = useMutation(api.messages.markRead);
  const send = useMutation(api.messages.send);

  // تعليم الرسائل كمقروءة عند فتح المحادثة
  useEffect(() => {
    void markRead({ conversationId }).catch(() => {});
  }, [conversationId, markRead]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await send({ conversationId, body });
      setBody("");
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر إرسال الرسالة"));
    } finally {
      setSending(false);
    }
  };

  if (data === undefined) {
    return <div className="clay p-6 animate-pulse h-64" />;
  }

  const otherLabel = data.isGuest ? "المالك" : "الضيف";

  return (
    <div className="clay p-4 flex flex-col h-[70vh]">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
        <h3 className="font-bold text-sm">محادثة مع {otherLabel}</h3>
        {data.contactRevealed && data.otherParty.phone && (
          <a
            href={`tel:${data.otherParty.phone}`}
            dir="ltr"
            className="clay-sm flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-700"
          >
            <Phone className="w-3.5 h-3.5" />
            {data.otherParty.phone}
          </a>
        )}
      </div>

      <div className={`text-xs rounded-xl px-3 py-2 mt-3 flex items-center gap-2 ${
        data.contactRevealed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
      }`}>
        {data.contactRevealed ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            حجز مؤكد بينكما — بيانات التواصل مكشوفة الآن
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5 shrink-0" />
            رقم الجوال يُكشف تلقائياً بعد تأكيد الحجز — حماية للطرفين
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 py-4">
        {data.messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
            لا رسائل بعد — ابدأ المحادثة 👋
          </p>
        ) : (
          data.messages.map((m) => (
            <div key={m._id} className={`flex ${m.isMine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                m.isMine
                  ? "bg-[var(--clay-accent-soft)] text-[var(--foreground)]"
                  : "bg-[var(--clay-accent)] text-white"
              }`}>
                <p className="text-sm leading-6 whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[10px] mt-1 ${m.isMine ? "text-[var(--muted-foreground)]" : "text-white/70"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="اكتب رسالتك..."
          className="clay-input flex-1 text-sm"
          maxLength={2000}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="clay-btn px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال
        </button>
      </div>
    </div>
  );
}
