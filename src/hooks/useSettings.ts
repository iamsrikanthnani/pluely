import { useEffect, useState } from "react";
import { useWindowResize } from "@/hooks";
import { useApp } from "@/contexts";
import {
  extractVariables,
  safeLocalStorage,
  deleteAllConversations,
} from "@/lib";
import { STORAGE_KEYS } from "@/config";

export const useSettings = () => {
  const {
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
  } = useApp();
  const { resizeWindow } = useWindowResize();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [variables, setVariables] = useState<{ key: string; value: string }[]>(
    []
  );
  const [sttVariables, setSttVariables] = useState<
    {
      key: string;
      value: string;
    }[]
  >([]);

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  useEffect(() => {
    resizeWindow(isPopoverOpen);
  }, [isPopoverOpen, resizeWindow]);

  const handleScreenshotModeChange = (value: "auto" | "manual") => {
    const newConfig = { ...screenshotConfiguration, mode: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotPromptChange = (value: string) => {
    const newConfig = { ...screenshotConfiguration, autoPrompt: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotEnabledChange = (enabled: boolean) => {
    const newConfig = { ...screenshotConfiguration, enabled };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  useEffect(() => {
    if (selectedAIProvider.provider) {
      const provider = allAiProviders.find(
        (p) => p.id === selectedAIProvider.provider
      );
      if (provider) {
        const variables = extractVariables(provider?.curl);
        setVariables(variables);
      }
    }
  }, [selectedAIProvider.provider]);

  useEffect(() => {
    if (selectedSttProvider.provider) {
      const provider = allSttProviders.find(
        (p) => p.id === selectedSttProvider.provider
      );
      if (provider) {
        const variables = extractVariables(provider?.curl);
        setSttVariables(variables);
      }
    }
  }, [selectedSttProvider.provider]);

  const handleDeleteAllChatsConfirm = async () => {
    try {
      await deleteAllConversations();
      setShowDeleteConfirmDialog(false);
    } catch (error) {
      console.error("Failed to delete all conversations:", error);
    }
  };

  return {
    isPopoverOpen,
    setIsPopoverOpen,
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    handleScreenshotModeChange,
    handleScreenshotPromptChange,
    handleScreenshotEnabledChange,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
    handleDeleteAllChatsConfirm,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    variables,
    sttVariables,
  };
};
