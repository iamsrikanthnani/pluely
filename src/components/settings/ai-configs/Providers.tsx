import { Button, Header, Input, Selection, TextInput } from "@/components";
import { UseSettingsReturn } from "@/types";
import { KeyIcon, TrashIcon } from "lucide-react";

export const Providers = ({
  allAiProviders,
  selectedAIProvider,
  onSetSelectedAIProvider,
  availableModels,
  modelsFetching,
  fetchModelsForProvider,
  localApiKey,
  setLocalApiKey,
  submitApiKey,
}: UseSettingsReturn) => {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Header
          title="Select AI Provider"
          description="Select your preferred AI service provider or custom providers to get started."
        />
        <Selection
          selected={selectedAIProvider?.provider}
          options={allAiProviders.map((provider) => ({
            label: provider.name,
            value: provider.id,
            isCustom: provider.isCustom,
          }))}
          placeholder="Choose your AI provider"
          onChange={(value) => {
            onSetSelectedAIProvider({
              ...selectedAIProvider,
              provider: value,
              apiKey: "",
              model: "",
            });
            setLocalApiKey("");
          }}
        />
      </div>

      <div className="space-y-2">
        <Header
          title="API Key"
          description={`Enter your ${selectedAIProvider.provider} API key to authenticate and access AI models. Your key is stored locally and never shared.`}
        />

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="**********"
              value={localApiKey}
              onChange={(value) => {
                setLocalApiKey(value.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && localApiKey.trim()) {
                  submitApiKey();
                  const provider = allAiProviders.find(
                    (p) => p.id === selectedAIProvider.provider
                  );
                  if (provider) {
                    fetchModelsForProvider(provider, localApiKey.trim());
                  }
                }
              }}
              disabled={false}
              className="flex-1 h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            {!selectedAIProvider.apiKey.trim() ? (
              <Button
                onClick={() => {
                  if (localApiKey.trim()) {
                    submitApiKey();
                    const provider = allAiProviders.find(
                      (p) => p.id === selectedAIProvider.provider
                    );
                    if (provider) {
                      fetchModelsForProvider(provider, localApiKey.trim());
                    }
                  }
                }}
                disabled={!localApiKey.trim()}
                size="icon"
                className="shrink-0 h-11 w-11"
                title="Submit API Key"
              >
                <KeyIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setLocalApiKey("");
                  onSetSelectedAIProvider({
                    ...selectedAIProvider,
                    apiKey: "",
                    model: "",
                  });
                }}
                size="icon"
                variant="destructive"
                className="shrink-0 h-11 w-11"
                title="Remove API Key"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Header
          title="Model"
          description={`${
            availableModels[selectedAIProvider.provider]?.length > 0
              ? "select your preferred "
              : "add your preferred "
          }${selectedAIProvider.provider} model to get started.`}
        />
        {allAiProviders.find((p) => p.id === selectedAIProvider.provider)
          ?.models ||
        availableModels[selectedAIProvider.provider]?.length > 0 ? (
          <div className="space-y-2">
            <Selection
              selected={selectedAIProvider?.model}
              options={availableModels[selectedAIProvider.provider]?.map(
                (model) => ({
                  label: model,
                  value: model,
                })
              )}
              placeholder={
                !selectedAIProvider?.apiKey
                  ? `Enter API Key to fetch ${selectedAIProvider.provider} models dynamically`
                  : "Choose your AI model"
              }
              onChange={(value) => {
                onSetSelectedAIProvider({
                  ...selectedAIProvider,
                  model: value,
                });
              }}
              disabled={!selectedAIProvider.apiKey.trim()}
              isLoading={modelsFetching}
            />
          </div>
        ) : (
          <TextInput
            placeholder={`Enter your ${selectedAIProvider.provider} model`}
            value={selectedAIProvider.model}
            onChange={(value) => {
              onSetSelectedAIProvider({
                ...selectedAIProvider,
                model: value,
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
