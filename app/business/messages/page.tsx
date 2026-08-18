import { ConversationConsole } from "@/components/conversation-console";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessMessagesPage() {
  const user = await requireBncSession("/business/messages", "business");
  return <ConversationConsole user={user} mode="business" />;
}
