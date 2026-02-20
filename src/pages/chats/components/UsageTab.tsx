import { Badge, Card, Empty, Markdown } from "@/components";
import { ChatConversation } from "@/types";
import {
  MessageCircleIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import moment from "moment";

interface UsageTabProps {
  messages: ChatConversation | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const UsageTab = ({ messages, messagesEndRef }: UsageTabProps) => {
  if (!messages || messages.messages.length === 0) {
    return (
      <Empty
        isLoading={false}
        icon={MessageCircleIcon}
        title="No messages found"
        description="Start a new message to get started"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24 px-2">
      {messages.messages.map((message, index, array) => {
        const isUser = message.role === "user";
        const showDate =
          index === 0 ||
          moment(message.timestamp).format("YYYY-MM-DD") !==
            moment(array[index - 1]?.timestamp).format("YYYY-MM-DD");

        return (
          <div key={message.id}>
            {showDate && (
              <Badge
                variant={"outline"}
                className="flex items-center justify-center my-4 w-fit mx-auto"
              >
                {moment(message.timestamp).format("ddd, MMM D")}
              </Badge>
            )}

            <div
              className={`flex gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="flex-shrink-0">
                  <div className="size-7 lg:size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <SparklesIcon className="size-3 lg:size-4 text-primary" />
                  </div>
                </div>
              )}

              <div
                className={`flex flex-col gap-1 max-w-[70%] ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                <Card
                  className={`p-3 text-xs lg:text-sm transition-all shadow-none ${
                    isUser
                      ? "!bg-primary text-primary-foreground !border-primary rounded-tr-sm"
                      : "!bg-muted/50 dark:!bg-muted/30 rounded-tl-sm"
                  }`}
                >
                  <Markdown>{message.content}</Markdown>
                </Card>
                <Badge
                  variant="outline"
                  className={`text-[10px] lg:text-xs bg-transparent border-none ${
                    isUser ? "-mr-1" : "-ml-1"
                  }`}
                >
                  {moment(message.timestamp).format("hh:mm A")}
                </Badge>
              </div>

              {isUser && (
                <div className="flex-shrink-0">
                  <div className="size-7 lg:size-8 rounded-full bg-primary flex items-center justify-center">
                    <UserIcon className="size-3 lg:size-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
