import { Button, Header, Input, Selection, TextInput } from "@/components";
import { UseSettingsReturn } from "@/types";
import { KeyIcon, TrashIcon } from "lucide-react";
import { useCallback } from "react";

export const Providers = ({
  allSttProviders,
  selectedSttProvider,
  onSetSelectedSttProvider,
  localSTTApiKey,
  setLocalSTTApiKey,
  submitSTTApiKey,
}: UseSettingsReturn) => {
  const findModel = useCallback(() => {
    const provider = allSttProviders.find(
      (p) => p.id === selectedSttProvider.provider
    );

    if (!provider) return null;

    // Check different locations where model information might be stored
    const modelFromFields =
      provider.request?.fields?.model ||
      provider.request?.fields?.model_id ||
      provider.request?.fields?.model_name;

    const modelFromQuery = provider.request?.query?.model;

    // Return the first available model identifier
    return modelFromFields || modelFromQuery || null;
  }, [allSttProviders, selectedSttProvider?.provider]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Header
          title="Select AI Provider"
          description="Select your preferred AI service provider or custom providers to get started."
        />
        <Selection
          selected={selectedSttProvider?.provider}
          options={allSttProviders.map((provider) => ({
            label: provider.name,
            value: provider.id,
            isCustom: provider.isCustom,
          }))}
          placeholder="Choose your AI provider"
          onChange={(value) => {
            onSetSelectedSttProvider({
              ...selectedSttProvider,
              provider: value,
              apiKey: "",
              model:
                allSttProviders.find((p) => p.id === value)?.request?.fields
                  ?.model ||
                allSttProviders.find((p) => p.id === value)?.request?.fields
                  ?.model ||
                allSttProviders.find((p) => p.id === value)?.request?.fields
                  ?.model_id ||
                allSttProviders.find((p) => p.id === value)?.request?.fields
                  ?.model_name ||
                "",
            });
            setLocalSTTApiKey("");
          }}
        />
      </div>

      <div className="space-y-2">
        <Header
          title="API Key"
          description={`Enter your ${selectedSttProvider.provider} API key to authenticate and access STT models. Your key is stored locally and never shared.`}
        />

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="**********"
              value={localSTTApiKey}
              onChange={(value) => {
                setLocalSTTApiKey(value.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitSTTApiKey();
                }
              }}
              disabled={false}
              className="flex-1 h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            {!selectedSttProvider.apiKey.trim() ? (
              <Button
                onClick={() => {
                  submitSTTApiKey();
                }}
                disabled={!localSTTApiKey.trim()}
                size="icon"
                className="shrink-0 h-11 w-11"
                title="Submit API Key"
              >
                <KeyIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onSetSelectedSttProvider({
                    ...selectedSttProvider,
                    apiKey: "",
                    model: "",
                  });
                  setLocalSTTApiKey("");
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
          description={`add your preferred ${selectedSttProvider.provider} model to get started.`}
        />
        <TextInput
          placeholder={`Enter your ${selectedSttProvider.provider} model${
            findModel() ? ` (default: ${findModel()})` : ""
          }`}
          value={selectedSttProvider.model || findModel() || ""}
          onChange={(value) => {
            onSetSelectedSttProvider({
              ...selectedSttProvider,
              model: value,
            });
          }}
        />
      </div>
    </div>
  );
};
