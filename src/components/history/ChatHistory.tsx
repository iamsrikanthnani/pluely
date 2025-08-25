import { useState, useEffect } from "react";
import {
  History,
  MessageSquare,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { loadChatHistory, deleteConversation } from "@/lib";
import { ChatConversation } from "@/types/completion";
import { useWindowResize, useWindowFocus } from "@/hooks";

interface ChatHistoryProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
}

export const ChatHistory = ({
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const { resizeWindow } = useWindowResize();

  // Load conversations when component mounts or popover opens
  useEffect(() => {
    if (isOpen) {
      const loadedConversations = loadChatHistory();
      setConversations(loadedConversations);
    }
  }, [isOpen]);

  const handleDeleteConversation = (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering conversation selection
    deleteConversation(conversationId);
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));

    // Emit event to notify other components about deletion
    window.dispatchEvent(
      new CustomEvent("conversationDeleted", {
        detail: conversationId,
      })
    );
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversationId(conversation.id);
    onSelectConversation(conversation);
    setIsOpen(false);

    // Clear the selection after a short delay to show the loading state
    setTimeout(() => {
      setSelectedConversationId(null);
    }, 2000);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  useEffect(() => {
    resizeWindow(isOpen);
  }, [isOpen, resizeWindow]);

  useWindowFocus({
    onFocusLost: () => {
      setIsOpen(false);
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          aria-label="View All Chat History"
          className="cursor-pointer"
          title="View All Chat History"
        >
          <History className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 border overflow-hidden border-input/50"
        sideOffset={8}
      >
        <div className="border-b border-input/50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              All Conversations
            </h2>
            <Button
              size="sm"
              onClick={() => {
                onNewConversation();
                setIsOpen(false);
              }}
              className="text-xs"
              title="Start new chat"
            >
              New Chat
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your conversation history
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-8.75rem)]">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Start chatting to see your history here
                </p>
              </div>
            ) : (
              <div className="space-y-1 pr-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                      conversation.id === currentConversationId
                        ? "bg-muted border-primary/20"
                        : "border-transparent hover:border-input/50"
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium truncate leading-5">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          {selectedConversationId === conversation.id && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="text-xs">Loading...</span>
                            </div>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) =>
                              handleDeleteConversation(conversation.id, e)
                            }
                            title="Delete conversation"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.updatedAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {conversation.messages.length} messages
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
