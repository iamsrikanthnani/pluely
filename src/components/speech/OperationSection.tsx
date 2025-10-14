import { ChatConversation } from "@/types";
import { Markdown } from "../Markdown";
import { Button, Card, Label, Switch } from "../ui";
import {
  BotIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeadphonesIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuickActions } from "./QuickActions";

type Props = {
  lastTranscription: string;
  lastAIResponse: string;
  isAIProcessing: boolean;
  conversation: ChatConversation;
  startNewConversation: () => void;
  quickActions: string[];
  addQuickAction: (action: string) => void;
  removeQuickAction: (action: string) => void;
  isManagingQuickActions: boolean;
  setIsManagingQuickActions: (isManaging: boolean) => void;
  showQuickActions: boolean;
  setShowQuickActions: (show: boolean) => void;
  handleQuickActionClick: (action: string) => void;
};

const SCROLL_THRESHOLD_PX = 32;

export const OperationSection = ({
  lastTranscription,
  lastAIResponse,
  isAIProcessing,
  conversation,
  startNewConversation,
  quickActions,
  addQuickAction,
  removeQuickAction,
  isManagingQuickActions,
  setIsManagingQuickActions,
  showQuickActions,
  setShowQuickActions,
  handleQuickActionClick,
}: Props) => {
  const [openConversation, setOpenConversation] = useState(true);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [pendingNewMessages, setPendingNewMessages] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = useMemo(() => {
    return conversation.messages
      .slice(2)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [conversation.messages]);

  const previousVisibleCountRef = useRef(visibleMessages.length);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = scrollContainerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    },
    []
  );

  const checkIfPinnedToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceToBottom <= SCROLL_THRESHOLD_PX;
  }, []);

  const handleScroll = useCallback(() => {
    const isAtBottom = checkIfPinnedToBottom();
    setIsPinnedToBottom((previous) =>
      previous === isAtBottom ? previous : isAtBottom
    );

    if (isAtBottom) {
      setPendingNewMessages(0);
    }
  }, [checkIfPinnedToBottom]);

  useEffect(() => {
    const hasNewMessages =
      visibleMessages.length > previousVisibleCountRef.current;

    if (isAutoScrollEnabled && isPinnedToBottom) {
      const behavior: ScrollBehavior = hasNewMessages ? "smooth" : "auto";
      scrollToBottom(behavior);
      setPendingNewMessages(0);
      requestAnimationFrame(() => {
        const isAtBottom = checkIfPinnedToBottom();
        setIsPinnedToBottom((previous) =>
          previous === isAtBottom ? previous : isAtBottom
        );
      });
    } else {
      if (hasNewMessages) {
        const newCount =
          visibleMessages.length - previousVisibleCountRef.current;
        if (newCount > 0) {
          setPendingNewMessages((previous) => previous + newCount);
        }
      }

      requestAnimationFrame(() => {
        const isAtBottom = checkIfPinnedToBottom();
        setIsPinnedToBottom((previous) =>
          previous === isAtBottom ? previous : isAtBottom
        );
        if (isAtBottom) {
          setPendingNewMessages(0);
        }
      });
    }

    previousVisibleCountRef.current = visibleMessages.length;
  }, [
    visibleMessages,
    isAutoScrollEnabled,
    isPinnedToBottom,
    scrollToBottom,
    checkIfPinnedToBottom,
  ]);

  const handleAutoScrollToggle = useCallback(
    (checked: boolean) => {
      setIsAutoScrollEnabled(checked);
      if (checked) {
        setIsPinnedToBottom(true);
        setPendingNewMessages(0);
        requestAnimationFrame(() => {
          scrollToBottom("auto");
        });
      }
    },
    [scrollToBottom]
  );

  const handleJumpToLatest = useCallback(() => {
    scrollToBottom();
    setIsPinnedToBottom(true);
    setPendingNewMessages(0);
  }, [scrollToBottom]);

  const shouldShowJumpToLatest =
    pendingNewMessages > 0 && !isPinnedToBottom;

  return (
    <div className="space-y-4">
      {/* AI Response */}
      {(lastAIResponse || isAIProcessing) && (
        <>
          <QuickActions
            actions={quickActions}
            onActionClick={handleQuickActionClick}
            onAddAction={addQuickAction}
            onRemoveAction={removeQuickAction}
            isManaging={isManagingQuickActions}
            setIsManaging={setIsManagingQuickActions}
            show={showQuickActions}
            setShow={setShowQuickActions}
          />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BotIcon className="w-3 h-3" />
              <h3 className="font-semibold text-xs">{`AI Assistant - answering to "${lastTranscription}"`}</h3>
            </div>
            <Card className="p-3 bg-transparent">
              {isAIProcessing && !lastAIResponse ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" />
                  <p className="text-xs italic">Generating response...</p>
                </div>
              ) : (
                <p className="text-md leading-relaxed whitespace-pre-wrap">
                  {lastAIResponse ? (
                    <Markdown>{lastAIResponse}</Markdown>
                  ) : null}
                  {isAIProcessing && (
                    <span className="inline-block w-2 h-4 animate-pulse ml-1" />
                  )}
                </p>
              )}
            </Card>
          </div>
        </>
      )}

      {visibleMessages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className="font-semibold text-md w-full cursor-pointer"
              onClick={() => setOpenConversation(!openConversation)}
            >
              Conversations
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="auto-scroll-toggle"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Auto-scroll
                </Label>
                <Switch
                  id="auto-scroll-toggle"
                  checked={isAutoScrollEnabled}
                  onCheckedChange={handleAutoScrollToggle}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpenConversation(!openConversation)}
              >
                {openConversation ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  startNewConversation();
                  setOpenConversation(false);
                }}
              >
                Start New
              </Button>
            </div>
          </div>

          {openConversation ? (
            <>
              {visibleMessages.length > 0 && (
                <div className="relative">
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="max-h-80 overflow-y-auto pr-1 space-y-3 pb-10"
                  >
                    {visibleMessages.map((message) => (
                      <div
                        key={message.id}
                        className="space-y-3 flex flex-row gap-2"
                      >
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            {message.role === "user" ? (
                              <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <BotIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <Card className="p-3 bg-transparent">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            <Markdown>{message.content}</Markdown>
                          </p>
                        </Card>
                      </div>
                    ))}
                  </div>
                  {shouldShowJumpToLatest && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleJumpToLatest}
                        className="pointer-events-auto"
                      >
                        Jump to latest ({pendingNewMessages})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
