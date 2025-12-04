import { Loader2, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Textarea as InputComponent,
  Markdown,
  Switch,
  CopyButton,
} from "@/components";
import { UseCompletionReturn } from "@/types";
import { MessageHistory } from "./MessageHistory";
import { useApp } from "@/contexts";
import { useWindowResize } from "@/hooks/useWindow";
import { useEffect, useRef } from "react";
import { useStealthTyping } from "@/hooks/useStealthTyping";

export const Input = ({
  isPopoverOpen,
  isLoading,
  reset,
  input,
  setInput,
  submit,
  handleKeyPress,
  handlePaste,
  currentConversationId,
  conversationHistory,
  startNewConversation,
  messageHistoryOpen,
  setMessageHistoryOpen,
  error,
  response,
  cancel,
  scrollAreaRef,
  inputRef,
  isHidden,
  keepEngaged,
  setKeepEngaged,
}: UseCompletionReturn & { isHidden: boolean }) => {
  const { isStealthActive, setStealthActive } = useApp();
  const { resizeWindow } = useWindowResize();
  // Removed local state for modifiers to rely on backend payload


  useEffect(() => {
    resizeWindow(isPopoverOpen);
  }, [isPopoverOpen, resizeWindow]);

  // Use a ref to track the current input value to avoid stale closures in the event listener
  // without re-binding the listener on every keystroke.
  const inputValueRef = useRef(input);
  useEffect(() => {
    inputValueRef.current = input;
  }, [input]);

  // Use a ref for handleKeyPress to avoid re-subscribing the listener when it changes
  const handleKeyPressRef = useRef(handleKeyPress);
  useEffect(() => {
    handleKeyPressRef.current = handleKeyPress;
  }, [handleKeyPress]);


  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useStealthTyping({
    isActive: isStealthActive,
    input,
    setInput,
    onSubmit: submit,
  });

  return (
    <div className="relative flex-1 min-w-0">
      <Popover
        open={isPopoverOpen}
        onOpenChange={(open) => {
          if (!open && !isLoading && !keepEngaged) {
            reset();
          }
        }}
      >
        <PopoverTrigger asChild className="!border-none !bg-transparent">
          <div
            className="relative select-none"
            onClick={() => {
              if (!isStealthActive) {
                setStealthActive(true);
              }
            }}
            onMouseDownCapture={(e) => {
              if (isStealthActive) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onFocusCapture={(e) => {
              if (isStealthActive) {
                e.preventDefault();
                e.stopPropagation();
                e.target.blur();
              }
            }}
          >
            <InputComponent
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
              disabled={isLoading || isHidden}
              className={`${isLoading || isHidden || (currentConversationId && conversationHistory.length > 0) ? "pr-14" : "pr-2"
                } ${isStealthActive ? "ring-2 ring-primary" : ""} h-[36px] min-h-[36px] resize-none overflow-y-auto py-1.5 break-words whitespace-pre-wrap`}
              onMouseDown={(e) => {
                // Removed local handler in favor of capture
              }}
              onFocus={(e) => {
                // Removed local handler in favor of capture
              }}
            />

            {/* Conversation thread indicator */}
            {
              currentConversationId &&
              conversationHistory.length > 0 &&
              !isLoading && (
                <div className="absolute select-none right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <MessageHistory
                    conversationHistory={conversationHistory}
                    currentConversationId={currentConversationId}
                    onStartNewConversation={startNewConversation}
                    messageHistoryOpen={messageHistoryOpen}
                    setMessageHistoryOpen={setMessageHistoryOpen}
                  />
                </div>
              )
            }

            {/* Loading indicator */}
            {
              isLoading && (
                <div className="absolute right-3 bottom-2 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )
            }
          </div>
        </PopoverTrigger>

        {/* Response Panel */}
        <PopoverContent
          align="end"
          side="bottom"
          className="w-screen p-0 border shadow-lg overflow-hidden"
          sideOffset={8}
          onMouseDownCapture={(e) => {
            if (isStealthActive) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onFocusCapture={(e) => {
            if (isStealthActive) {
              e.preventDefault();
              e.stopPropagation();
              e.target.blur();
            }
          }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex flex-row gap-1 items-center">
              <h3 className="font-semibold text-xs select-none">
                {keepEngaged ? "Conversation Mode" : "AI Response"}
              </h3>
              <div className="text-[10px] text-muted-foreground/70">
                (Use arrow keys to scroll)
              </div>
            </div>
            <div className="flex items-center gap-2 select-none">
              <div className="flex flex-row items-center gap-2 mr-2">
                <p className="text-[10px]">{`Toggle ${keepEngaged ? "AI response" : "conversation mode"
                  }`}</p>
                <span className="text-[10px] text-muted-foreground/60 bg-muted/30 px-1 py-0 rounded border border-input/50">
                  {navigator.platform.toLowerCase().includes("mac")
                    ? "⌘"
                    : "Ctrl"}{" "}
                  + K
                </span>
                <Switch
                  checked={keepEngaged}
                  onCheckedChange={(checked) => {
                    setKeepEngaged(checked);
                    // Focus input after toggle
                    setTimeout(() => {
                      inputRef?.current?.focus();
                    }, 100);
                  }}
                />
              </div>
              <CopyButton content={response} />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (isLoading) {
                    cancel();
                  } else if (keepEngaged) {
                    // When keepEngaged is on, close everything and start new conversation
                    setKeepEngaged(false);
                    startNewConversation();
                  } else {
                    reset();
                  }
                }}
                className="cursor-pointer"
                title={
                  isLoading
                    ? "Cancel loading"
                    : keepEngaged
                      ? "Close and start new conversation"
                      : "Clear conversation"
                }
              >
                <XIcon />
              </Button>
            </div>
          </div>

          <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-7rem)]">
            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  <strong>Error:</strong> {error}
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 my-4 text-muted-foreground animate-pulse select-none">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating response...</span>
                </div>
              )}
              {response && <Markdown>{response}</Markdown>}

              {/* Conversation History - Separate scroll, no auto-scroll */}
              {keepEngaged && conversationHistory.length > 1 && (
                <div className="space-y-3 pt-3">
                  {conversationHistory
                    .sort((a, b) => b?.timestamp - a?.timestamp)
                    .map((message, index) => {
                      if (!isLoading && index === 0) {
                        return null;
                      }
                      return (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg text-sm ${message.role === "user"
                            ? "bg-primary/10 border-l-4 border-primary"
                            : "bg-muted/50"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {message.role === "user" ? "You" : "AI"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                          <Markdown>{message.content}</Markdown>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};
