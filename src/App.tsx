import { useCallback, useEffect, useState } from "react";
import { Card, Settings, SystemAudio, Updater } from "./components";
import { Completion } from "./components/completion";
import { ChatHistory } from "./components/history";
import { AudioVisualizer } from "./components/speech/audio-visualizer";
import { StatusIndicator } from "./components/speech/StatusIndicator";
import { useTitles } from "./hooks";
import { useSystemAudio } from "./hooks/useSystemAudio";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[role='button']",
  "[role='tab']",
  "[role='option']",
  "[contenteditable='true']",
  "[data-no-drag]",
  "[data-tauri-drag-disabled]",
].join(", ");

const isInteractiveElement = (element: EventTarget | null) => {
  if (!(element instanceof HTMLElement)) return false;
  return Boolean(element.closest(INTERACTIVE_SELECTOR));
};

const App = () => {
  const systemAudio = useSystemAudio();
  const [isHidden, setIsHidden] = useState(false);
  // Initialize title management
  useTitles();
  const handleCardPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const isMouseEvent = event.pointerType === "mouse" || event.pointerType === "";
    if (isMouseEvent && event.button !== 0) return;
    if (isInteractiveElement(event.target)) return;
    if (typeof window === "undefined") return;

    event.preventDefault();

    getCurrentWindow()
      .startDragging()
      .catch((error) => {
        console.error("Failed to start dragging window:", error);
      });
  }, []);
  const handleSelectConversation = (conversation: any) => {
    // Use localStorage to communicate the selected conversation to Completion component
    localStorage.setItem("selectedConversation", JSON.stringify(conversation));
    // Trigger a custom event to notify Completion component
    window.dispatchEvent(
      new CustomEvent("conversationSelected", {
        detail: conversation,
      })
    );
  };

  const handleNewConversation = () => {
    // Clear any selected conversation and trigger new conversation
    localStorage.removeItem("selectedConversation");
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  // WINDOWS HIDE/SHOW TOGGLE WINDOW WORKAROUND FOR SHORTCUTS
  useEffect(() => {
    const unlistenPromise = listen<boolean>(
      "toggle-window-visibility",
      (event) => {
        const platform = navigator.platform.toLowerCase();
        if (typeof event.payload === "boolean" && platform.includes("win")) {
          setIsHidden(!event.payload);
          // find popover open and close it
          const popover = document.getElementById("popover-content");
          // set display to none, change data-state to closed
          if (popover) {
            popover.style.setProperty("display", "none", "important");
            // update the data-state to closed
            popover.setAttribute("data-state", "closed");

            // Also find and update the popover trigger's data-state
            const popoverTriggers = document.querySelectorAll(
              '[data-slot="popover-trigger"]'
            );
            popoverTriggers.forEach((trigger) => {
              trigger.setAttribute("data-state", "closed");
            });
          }
        }
      }
    );

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div
      className={`w-screen h-screen flex overflow-hidden justify-center items-start ${
        isHidden ? "hidden pointer-events-none" : ""
      }`}
    >
      <Card
        className="w-full flex flex-row items-center gap-2 p-2"
        onPointerDown={handleCardPointerDown}
      >
        <SystemAudio {...systemAudio} />
        {systemAudio?.capturing ? (
          <div className="flex flex-row items-center gap-2 justify-between w-full">
            <div className="flex flex-1 items-center gap-2">
              <AudioVisualizer isRecording={systemAudio?.capturing} />
            </div>
            <div className="flex !w-fit items-center gap-2">
              <StatusIndicator
                setupRequired={systemAudio.setupRequired}
                error={systemAudio.error}
                isProcessing={systemAudio.isProcessing}
                isAIProcessing={systemAudio.isAIProcessing}
                capturing={systemAudio.capturing}
              />
            </div>
          </div>
        ) : null}

        <div
          className={`${
            systemAudio?.capturing
              ? "hidden w-full fade-out transition-all duration-300"
              : "w-full flex flex-row gap-2 items-center"
          }`}
        >
          <Completion isHidden={isHidden} />
          <ChatHistory
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            currentConversationId={null}
          />
          <Settings />
        </div>

        <Updater />
      </Card>
    </div>
  );
};

export default App;
