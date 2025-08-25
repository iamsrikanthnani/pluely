import { TYPE_AI_PROVIDER } from "./ai-provider.type";
import { ScreenshotConfig, ScreenshotMode } from "./settings";
import { TYPE_STT_PROVIDER } from "./stt.types";

export interface UseSettingsReturn {
  isPopoverOpen: boolean;
  setIsPopoverOpen: (isOpen: boolean) => void;
  systemPrompt: string;
  setSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
  screenshotConfiguration: ScreenshotConfig;
  setScreenshotConfiguration: React.Dispatch<
    React.SetStateAction<ScreenshotConfig>
  >;
  handleScreenshotModeChange: (value: ScreenshotMode) => void;
  handleScreenshotPromptChange: (value: string) => void;
  handleScreenshotEnabledChange: (enabled: boolean) => void;
  allAiProviders: TYPE_AI_PROVIDER[];
  allSttProviders: TYPE_STT_PROVIDER[];
  selectedAIProvider: { provider: string; apiKey: string; model: string };
  selectedSttProvider: { provider: string; apiKey: string; model: string };
  onSetSelectedAIProvider: (provider: {
    provider: string;
    apiKey: string;
    model: string;
  }) => void;
  onSetSelectedSttProvider: (provider: {
    provider: string;
    apiKey: string;
    model: string;
  }) => void;
  availableModels: { [providerId: string]: string[] };
  modelsFetching: boolean;
  fetchModelsForProvider: (
    provider: TYPE_AI_PROVIDER,
    apiKey: string
  ) => Promise<void>;
  localApiKey: string;
  setLocalApiKey: React.Dispatch<React.SetStateAction<string>>;
  submitApiKey: () => void;
  localSTTApiKey: string;
  setLocalSTTApiKey: React.Dispatch<React.SetStateAction<string>>;
  submitSTTApiKey: () => void;
  handleDeleteAllChatsConfirm: () => void;
  showDeleteConfirmDialog: boolean;
  setShowDeleteConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>;
}
