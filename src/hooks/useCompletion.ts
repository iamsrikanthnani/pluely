import { useState, useCallback, useRef, useEffect } from "react";
import { useWindowResize } from "./useWindow";
import { useWindowFocus } from "@/hooks";
import { MAX_FILES } from "@/config";
import { useApp } from "@/contexts";
import { fetchAIResponse, safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";

// Types for completion
interface AttachedFile {
  id: string;
  name: string;
  type: string;
  base64: string;
  size: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface CompletionState {
  input: string;
  response: string;
  isLoading: boolean;
  error: string | null;
  attachedFiles: AttachedFile[];
  currentConversationId: string | null;
  conversationHistory: ChatMessage[];
}

export const useCompletion = () => {
  const {
    selectedAIProvider,
    allAiProviders,
    systemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
  } = useApp();

  const [state, setState] = useState<CompletionState>({
    input: "",
    response: "",
    isLoading: false,
    error: null,
    attachedFiles: [],
    currentConversationId: null,
    conversationHistory: [],
  });
  const [micOpen, setMicOpen] = useState(false);
  const [enableVAD, setEnableVAD] = useState(false);
  const [messageHistoryOpen, setMessageHistoryOpen] = useState(false);
  const [isFilesPopoverOpen, setIsFilesPopoverOpen] = useState(false);

  const { resizeWindow } = useWindowResize();

  // Sync screenshot config with global state
  useEffect(() => {
    setScreenshotConfiguration(screenshotConfiguration);
  }, [screenshotConfiguration]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const setResponse = useCallback((value: string) => {
    setState((prev) => ({ ...prev, response: value }));
  }, []);

  const addFile = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const attachedFile: AttachedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        base64,
        size: file.size,
      };

      setState((prev) => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, attachedFile],
      }));
    } catch (error) {
      console.error("Failed to process file:", error);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((f) => f.id !== fileId),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState((prev) => ({ ...prev, attachedFiles: [] }));
  }, []);

  const submit = useCallback(
    async (speechText?: string) => {
      const input = speechText || state.input;

      // Check if AI provider is configured
      if (!selectedAIProvider.provider || !selectedAIProvider.apiKey) {
        setState((prev) => ({
          ...prev,
          error: "Please configure your AI provider and API key in settings",
        }));
        return;
      }

      const provider = allAiProviders.find(
        (p) => p.id === selectedAIProvider.provider
      );
      if (!provider) {
        setState((prev) => ({
          ...prev,
          error: "Invalid provider selected",
        }));
        return;
      }

      const model = selectedAIProvider.model || provider.defaultModel;
      if (!model) {
        setState((prev) => ({
          ...prev,
          error: "Please select a model in settings",
        }));
        return;
      }

      if (!input.trim()) {
        return;
      }

      if (speechText) {
        setState((prev) => ({
          ...prev,
          input: speechText,
        }));
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        response: "",
      }));

      try {
        // Prepare message history for the AI
        const messageHistory = state.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Handle image attachments
        let imageBase64: string | undefined;
        if (state.attachedFiles.length > 0) {
          const firstImage = state.attachedFiles[0];
          if (firstImage.type.startsWith("image/")) {
            imageBase64 = firstImage.base64;
          }
        }

        let fullResponse = "";

        // Use the fetchAIResponse function
        for await (const chunk of fetchAIResponse({
          provider,
          apiKey: selectedAIProvider.apiKey,
          systemPrompt: systemPrompt || undefined,
          history: messageHistory,
          userMessage: input,
          model,
          stream: true,
          imageBase64,
        })) {
          fullResponse += chunk;
          setState((prev) => ({
            ...prev,
            response: prev.response + chunk,
          }));
        }

        setState((prev) => ({ ...prev, isLoading: false }));

        // Save the conversation after successful completion
        if (fullResponse) {
          saveCurrentConversation(input, fullResponse, state.attachedFiles);
          // Clear input and attached files after saving
          setState((prev) => ({
            ...prev,
            input: "",
            attachedFiles: [],
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        }));
      }
    },
    [
      state.input,
      state.attachedFiles,
      selectedAIProvider,
      allAiProviders,
      systemPrompt,
      state.conversationHistory,
    ]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState((prev) => ({
      ...prev,
      input: "",
      response: "",
      error: null,
      attachedFiles: [],
    }));
  }, [cancel]);

  // Helper function to convert file to base64
  const fileToBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string)?.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }, []);

  // Conversation management functions
  const saveConversation = useCallback((conversation: ChatConversation) => {
    try {
      const existingData = safeLocalStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      let conversations: ChatConversation[] = [];

      if (existingData) {
        conversations = JSON.parse(existingData);
      }

      const existingIndex = conversations.findIndex(
        (c) => c.id === conversation.id
      );
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }

      safeLocalStorage.setItem(
        STORAGE_KEYS.CHAT_HISTORY,
        JSON.stringify(conversations)
      );
    } catch (error) {
      console.error("Failed to save conversation:", error);
    }
  }, []);

  const getConversation = useCallback((id: string): ChatConversation | null => {
    try {
      const existingData = safeLocalStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (!existingData) return null;

      const conversations: ChatConversation[] = JSON.parse(existingData);
      return conversations.find((c) => c.id === id) || null;
    } catch (error) {
      console.error("Failed to get conversation:", error);
      return null;
    }
  }, []);

  const generateConversationTitle = useCallback(
    (userMessage: string): string => {
      const words = userMessage.trim().split(" ").slice(0, 6);
      return (
        words.join(" ") +
        (words.length < userMessage.trim().split(" ").length ? "..." : "")
      );
    },
    []
  );

  const loadConversation = useCallback((conversation: ChatConversation) => {
    setState((prev) => ({
      ...prev,
      currentConversationId: conversation.id,
      conversationHistory: conversation.messages,
      input: "",
      response: "",
      error: null,
      isLoading: false,
    }));
  }, []);

  const startNewConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentConversationId: null,
      conversationHistory: [],
      input: "",
      response: "",
      error: null,
      isLoading: false,
      attachedFiles: [],
    }));
  }, []);

  const saveCurrentConversation = useCallback(
    (
      userMessage: string,
      assistantResponse: string,
      _attachedFiles: AttachedFile[]
    ) => {
      const conversationId =
        state.currentConversationId ||
        `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      const userMsg: ChatMessage = {
        id: `msg_${timestamp}_user`,
        role: "user",
        content: userMessage,
        timestamp,
      };

      const assistantMsg: ChatMessage = {
        id: `msg_${timestamp}_assistant`,
        role: "assistant",
        content: assistantResponse,
        timestamp: timestamp + 1,
      };

      const newMessages = [...state.conversationHistory, userMsg, assistantMsg];
      const title =
        state.conversationHistory.length === 0
          ? generateConversationTitle(userMessage)
          : undefined;

      const conversation: ChatConversation = {
        id: conversationId,
        title:
          title ||
          (state.currentConversationId
            ? getConversation(state.currentConversationId)?.title ||
              generateConversationTitle(userMessage)
            : generateConversationTitle(userMessage)),
        messages: newMessages,
        createdAt: state.currentConversationId
          ? getConversation(state.currentConversationId)?.createdAt || timestamp
          : timestamp,
        updatedAt: timestamp,
      };

      saveConversation(conversation);

      setState((prev) => ({
        ...prev,
        currentConversationId: conversationId,
        conversationHistory: newMessages,
      }));
    },
    [
      state.currentConversationId,
      state.conversationHistory,
      generateConversationTitle,
      getConversation,
      saveConversation,
    ]
  );

  // Listen for conversation events from the main ChatHistory component
  useEffect(() => {
    const handleConversationSelected = (event: any) => {
      const conversation = event.detail;
      loadConversation(conversation);
    };

    const handleNewConversation = () => {
      startNewConversation();
    };

    const handleConversationDeleted = (event: any) => {
      const deletedId = event.detail;
      // If the currently active conversation was deleted, start a new one
      if (state.currentConversationId === deletedId) {
        startNewConversation();
      }
    };

    window.addEventListener("conversationSelected", handleConversationSelected);
    window.addEventListener("newConversation", handleNewConversation);
    window.addEventListener("conversationDeleted", handleConversationDeleted);

    return () => {
      window.removeEventListener(
        "conversationSelected",
        handleConversationSelected
      );
      window.removeEventListener("newConversation", handleNewConversation);
      window.removeEventListener(
        "conversationDeleted",
        handleConversationDeleted
      );
    };
  }, [loadConversation, startNewConversation, state.currentConversationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILES = 6;

    files.forEach((file) => {
      if (
        file.type.startsWith("image/") &&
        state.attachedFiles.length < MAX_FILES
      ) {
        addFile(file);
      }
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleScreenshotSubmit = async (base64: string, prompt?: string) => {
    try {
      if (prompt) {
        // Auto mode: Submit directly to AI with screenshot
        const attachedFile: AttachedFile = {
          id: Date.now().toString(),
          name: `screenshot_${Date.now()}.png`,
          type: "image/png",
          base64: base64,
          size: base64.length,
        };

        // Check if AI provider is configured
        if (!selectedAIProvider.provider || !selectedAIProvider.apiKey) {
          setState((prev) => ({
            ...prev,
            error: "Please configure your AI provider and API key in settings",
          }));
          return;
        }

        const provider = allAiProviders.find(
          (p) => p.id === selectedAIProvider.provider
        );
        if (!provider) {
          setState((prev) => ({
            ...prev,
            error: "Invalid provider selected",
          }));
          return;
        }

        const model = selectedAIProvider.model || provider.defaultModel;
        if (!model) {
          setState((prev) => ({
            ...prev,
            error: "Please select a model in settings",
          }));
          return;
        }

        // Cancel any existing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        setState((prev) => ({
          ...prev,
          input: prompt,
          isLoading: true,
          error: null,
          response: "",
        }));

        try {
          // Prepare message history for the AI
          const messageHistory = state.conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

          let fullResponse = "";

          // Use the fetchAIResponse function with image
          for await (const chunk of fetchAIResponse({
            provider,
            apiKey: selectedAIProvider.apiKey,
            systemPrompt: systemPrompt || undefined,
            history: messageHistory,
            userMessage: prompt,
            model,
            stream: true,
            imageBase64: base64,
          })) {
            fullResponse += chunk;
            setState((prev) => ({
              ...prev,
              response: prev.response + chunk,
            }));
          }

          setState((prev) => ({ ...prev, isLoading: false }));

          // Save the conversation after successful completion
          if (fullResponse) {
            saveCurrentConversation(prompt, fullResponse, [attachedFile]);
            // Clear input after saving
            setState((prev) => ({
              ...prev,
              input: "",
            }));
          }
        } catch (error) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : "An error occurred",
            isLoading: false,
          }));
        }
      } else {
        // Manual mode: Add to attached files
        const attachedFile: AttachedFile = {
          id: Date.now().toString(),
          name: `screenshot_${Date.now()}.png`,
          type: "image/png",
          base64: base64,
          size: base64.length,
        };

        setState((prev) => ({
          ...prev,
          attachedFiles: [...prev.attachedFiles, attachedFile],
        }));
      }
    } catch (error) {
      console.error("Failed to process screenshot:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred processing screenshot",
        isLoading: false,
      }));
    }
  };

  const onRemoveAllFiles = () => {
    clearFiles();
    setIsFilesPopoverOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!state.isLoading && state.input.trim()) {
        submit();
      }
    }
  };

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      // Check if clipboard contains images
      const items = e.clipboardData?.items;
      if (!items) return;

      const hasImages = Array.from(items).some((item) =>
        item.type.startsWith("image/")
      );

      // If we have images, prevent default text pasting and process images
      if (hasImages) {
        e.preventDefault();

        const processedFiles: File[] = [];

        Array.from(items).forEach((item) => {
          if (
            item.type.startsWith("image/") &&
            state.attachedFiles.length + processedFiles.length < MAX_FILES
          ) {
            const file = item.getAsFile();
            if (file) {
              processedFiles.push(file);
            }
          }
        });

        // Process all files
        await Promise.all(processedFiles.map((file) => addFile(file)));
      }
    },
    [state.attachedFiles.length, addFile]
  );

  const isPopoverOpen =
    state.isLoading || state.response !== "" || state.error !== null;

  useEffect(() => {
    resizeWindow(
      isPopoverOpen || micOpen || messageHistoryOpen || isFilesPopoverOpen
    );
  }, [
    isPopoverOpen,
    micOpen,
    messageHistoryOpen,
    resizeWindow,
    isFilesPopoverOpen,
  ]);

  // Auto scroll to bottom when response updates
  useEffect(() => {
    if (state.response && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [state.response]);

  useWindowFocus({
    onFocusLost: () => {
      setMicOpen(false);
      setMessageHistoryOpen(false);
    },
  });

  return {
    input: state.input,
    setInput,
    response: state.response,
    setResponse,
    isLoading: state.isLoading,
    error: state.error,
    attachedFiles: state.attachedFiles,
    addFile,
    removeFile,
    clearFiles,
    submit,
    cancel,
    reset,
    setState,
    enableVAD,
    setEnableVAD,
    micOpen,
    setMicOpen,
    currentConversationId: state.currentConversationId,
    conversationHistory: state.conversationHistory,
    loadConversation,
    startNewConversation,
    messageHistoryOpen,
    setMessageHistoryOpen,
    screenshotConfiguration,
    setScreenshotConfiguration,
    handleScreenshotSubmit,
    handleFileSelect,
    handleKeyPress,
    handlePaste,
    isPopoverOpen,
    scrollAreaRef,
    resizeWindow,
    isFilesPopoverOpen,
    setIsFilesPopoverOpen,
    onRemoveAllFiles,
  };
};
