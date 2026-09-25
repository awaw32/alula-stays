import { Navigation } from "@/components/Navigation";
import { MessagesPage } from "@/components/messages/Messages";
import { useParams } from "react-router";

export default function Messages() {
  const { conversationId } = useParams<{ conversationId: string }>();

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-6">الرسائل</h1>
        <MessagesPage initialConversationId={conversationId} />
      </div>
    </div>
  );
}
