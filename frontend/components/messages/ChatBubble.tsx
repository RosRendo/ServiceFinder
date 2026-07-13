import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ChatMessage } from "@/lib/hooks/useChat";
import { Check, CheckCheck } from "lucide-react";

interface ChatBubbleProps {
  message: ChatMessage;
  currentUserId: string | null;
}

const ChatBubble = ({ message, currentUserId }: ChatBubbleProps) => {
  const isCurrentUser = currentUserId != null && message.senderId === currentUserId;

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-soft-sm",
          isCurrentUser
            ? "chat-bubble-user rounded-br-md"
            : "chat-bubble-other rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px]",
            isCurrentUser ? "justify-end opacity-80" : "text-muted-foreground"
          )}
        >
          <span>{format(new Date(message.timestamp), "h:mm a")}</span>
          {isCurrentUser && (
            message.read ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
