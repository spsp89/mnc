import { ConversationConsole } from "@/components/conversation-console";
import { requireBncSession } from "@/lib/server-auth";

export default async function AccountMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string | string[] }>;
}) {
  const params = await searchParams;
  const conversation = Array.isArray(params.conversation) ? params.conversation[0] : params.conversation;
  const user = await requireBncSession("/account/messages", "customer");
  return <ConversationConsole user={user} mode="customer" initialConversationId={conversation} />;
}
