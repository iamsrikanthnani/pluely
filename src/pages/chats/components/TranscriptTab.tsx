import { Badge, Empty, Markdown } from "@/components";
import { ChatConversation } from "@/types";
import { FileTextIcon } from "lucide-react";

interface TranscriptTabProps {
  messages: ChatConversation | null;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const TranscriptTab = ({ messages }: TranscriptTabProps) => {
  if (!messages || messages.messages.length === 0) {
    return (
      <Empty
        isLoading={false}
        icon={FileTextIcon}
        title="No transcript"
        description="This conversation has no messages to display"
      />
    );
  }

  const startTime = messages.createdAt || messages.messages[0]?.timestamp || 0;

  return (
    <div className="flex flex-col gap-4 py-4">
      {messages.messages.map((message) => {
        const elapsed = message.timestamp - startTime;
        const timeLabel = formatElapsed(elapsed);
        const speaker = message.role === "user" ? "Them" : "AI";

        return (
          <div key={message.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">
                {speaker}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {timeLabel}
              </Badge>
            </div>
            <div className="pl-3 text-sm border-l-2 border-muted">
              <Markdown>{message.content}</Markdown>
            </div>
          </div>
        );
      })}
    </div>
  );
};
