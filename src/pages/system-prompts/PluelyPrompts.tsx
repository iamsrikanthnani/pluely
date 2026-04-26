import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Header,
  Empty,
} from "@/components";
import {
  CheckCircle2,
  Sparkles,
  BotIcon,
  ClockIcon,
} from "lucide-react";
import { useApp } from "@/contexts";
import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";
import moment from "moment";

interface PluelyPrompt {
  title: string;
  prompt: string;
  modelId: string;
  modelName: string;
}

interface PluelyPromptsResponse {
  prompts: PluelyPrompt[];
  total: number;
  last_updated?: string;
}

interface Model {
  provider: string;
  name: string;
  id: string;
  model: string;
  description: string;
  modality: string;
  isAvailable: boolean;
}

const SELECTED_PLUELY_MODEL_STORAGE_KEY = "selected_pluely_model";
const SELECTED_PLUELY_PROMPT_STORAGE_KEY = "selected_pluely_prompt";

export const PluelyPrompts = () => {
  const {
    setSystemPrompt,
    setSupportsImages,
    pluelyApiEnabled,
  } = useApp();
  const [prompts, setPrompts] = useState<PluelyPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedPluelyPrompt, setSelectedPluelyPrompt] =
    useState<PluelyPrompt | null>(() => {
      const stored = safeLocalStorage.getItem(
        SELECTED_PLUELY_PROMPT_STORAGE_KEY
      );
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
      return null;
    });
  const [models, setModels] = useState<Model[]>([]);
  const fetchInitiated = useRef(false);

  useEffect(() => {
    if (!fetchInitiated.current) {
      fetchInitiated.current = true;
      fetchPluelyPrompts();
      fetchModels();
    }
  }, []);

  // Watch for changes in user's selected prompt and clear Pluely selection if needed
  useEffect(() => {
    const checkUserPromptSelection = () => {
      const userSelectedPromptId = safeLocalStorage.getItem(
        STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID
      );
      if (userSelectedPromptId) {
        setSelectedPluelyPrompt(null);
      }
    };

    checkUserPromptSelection();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID) {
        checkUserPromptSelection();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fetchPluelyPrompts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await invoke<PluelyPromptsResponse>("fetch_prompts");
      setPrompts(response.prompts);
      if (response.last_updated) {
        setLastUpdated(response.last_updated);
      }
    } catch (err) {
      console.error("Failed to fetch Pluely prompts:", err);
      setError(
        typeof err === "string" ? err : "Failed to fetch Pluely prompts"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const fetchedModels = await invoke<Model[]>("fetch_models");
      setModels(fetchedModels);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  };

  const handleSelectPluelyPrompt = async (prompt: PluelyPrompt) => {
    try {
      setSystemPrompt(prompt.prompt);
      setSelectedPluelyPrompt(prompt);

      safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID);
      safeLocalStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, prompt.prompt);
      safeLocalStorage.setItem(
        SELECTED_PLUELY_PROMPT_STORAGE_KEY,
        JSON.stringify(prompt)
      );

      const matchingModel = models.find(
        (model) => model.model === prompt.modelId || model.id === prompt.modelId
      );

      if (matchingModel) {
        if (pluelyApiEnabled) {
          const hasImageSupport =
            matchingModel.modality?.includes("image") ?? false;
          setSupportsImages(hasImageSupport);
        }

        await invoke("secure_storage_save", {
          items: [
            {
              key: SELECTED_PLUELY_MODEL_STORAGE_KEY,
              value: JSON.stringify(matchingModel),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to select Pluely prompt:", error);
    }
  };

  const handleCardClick = (prompt: PluelyPrompt) => {
    handleSelectPluelyPrompt(prompt);
  };

  const isPromptSelected = (prompt: PluelyPrompt) => {
    return (
      selectedPluelyPrompt?.title === prompt.title &&
      selectedPluelyPrompt?.modelId === prompt.modelId
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        <Header
          title="Pluely Default Prompts"
          description="Pre-configured prompts with optimal model selection"
        />
        <Empty
          isLoading={true}
          icon={Sparkles}
          title="Loading prompts..."
          description="Fetching Pluely default prompts"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 mt-6">
        <Header
          title="Pluely Default Prompts"
          description="Pre-configured prompts with optimal model selection"
        />
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-start justify-between gap-3 border-t border-input/50 pt-6">
        <div className="flex items-start gap-3 w-full">
          <div className="flex flex-col gap-1 w-full">
            <Header
              title="Pluely Default Prompts"
              description="Pre-configured prompts with optimal model pairings. Selecting a prompt will automatically set the recommended AI model for best results."
            />
            {lastUpdated && (
              <div className="flex justify-end items-center gap-1 text-[10px] text-muted-foreground">
                <ClockIcon className="size-2" />
                <span>Last updated: {moment(lastUpdated).fromNow()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 pb-4">
        {prompts.map((prompt, index) => {
          const isSelected = isPromptSelected(prompt);
          return (
            <Card
              key={`${prompt.title}-${index}`}
              className={`relative border lg:border-2 shadow-none p-4 pb-10 gap-0 group transition-all hover:shadow-sm cursor-pointer ${
                isSelected
                  ? "!bg-primary/5 dark:!bg-primary/10 border-primary"
                  : "!bg-black/5 dark:!bg-white/5 border-transparent"
              }`}
              onClick={() => handleCardClick(prompt)}
            >
              {isSelected && (
                <CheckCircle2 className="size-5 text-green-500 flex-shrink-0 absolute top-2 right-2" />
              )}
              <CardHeader className="p-0 pb-0 select-none">
                <div className="flex items-start justify-between gap-2 relative">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-[10px] text-base line-clamp-1 flex-1 pr-3">
                        {prompt.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="h-14 line-clamp-3 text-xs leading-relaxed">
                      {prompt.prompt}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="absolute bottom-2 left-4 w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-muted-foreground select-none">
                  <BotIcon className="size-3" />
                  <span className="line-clamp-1 max-w-[180px]">
                    {prompt.modelName}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
