import { Dispatch, SetStateAction } from "react";
import { ScreenshotConfig, TYPE_AI_PROVIDER, TYPE_STT_PROVIDER } from "@/types";

export type IContextType = {
  systemPrompt: string;
  setSystemPrompt: Dispatch<SetStateAction<string>>;
  allAiProviders: TYPE_AI_PROVIDER[];
  customAiProviders: TYPE_AI_PROVIDER[];
  selectedAIProvider: { provider: string; apiKey: string; model: string };
  onSetSelectedAIProvider: ({
    provider,
    apiKey,
    model,
  }: {
    provider: string;
    apiKey: string;
    model: string;
  }) => void;
  allSttProviders: TYPE_STT_PROVIDER[];
  customSttProviders: TYPE_STT_PROVIDER[];
  selectedSttProvider: { provider: string; apiKey: string; model: string };
  onSetSelectedSttProvider: ({
    provider,
    apiKey,
    model,
  }: {
    provider: string;
    apiKey: string;
    model: string;
  }) => void;
  screenshotConfiguration: ScreenshotConfig;
  setScreenshotConfiguration: React.Dispatch<
    React.SetStateAction<ScreenshotConfig>
  >;
  loadData: () => void;
};
