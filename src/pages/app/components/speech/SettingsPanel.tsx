import { useState } from "react";
import {
  Button,
  Label,
  Slider,
  Switch,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components";
import {
  ChevronDownIcon,
  SettingsIcon,
  WandIcon,
  RotateCcwIcon,
  ChevronUpIcon,
} from "lucide-react";
import { VadConfig } from "@/hooks/useSystemAudio";
import {
  PROMPT_TEMPLATES,
  getPromptTemplateById,
} from "@/lib/platform-instructions";
import { TYPE_PROVIDER } from "@/types";
import { cn } from "@/lib/utils";
import { useSystemPrompts } from "@/hooks";

// Sentinel value used by the overlay's system-prompt selector to
// represent the "(none)" option (revert to default prompt).
const PROMPT_NONE_VALUE = "__none__";

// Sensitivity presets for simpler UX
const SENSITIVITY_PRESETS = {
  low: {
    sensitivity_rms: 0.015,
    noise_gate_threshold: 0.005,
    label: "Low",
    description: "Only picks up clear, loud speech",
  },
  normal: {
    sensitivity_rms: 0.012,
    noise_gate_threshold: 0.003,
    label: "Normal",
    description: "Balanced for typical conversations",
  },
  high: {
    sensitivity_rms: 0.008,
    noise_gate_threshold: 0.002,
    label: "High",
    description: "Picks up quieter speech",
  },
} as const;

type SensitivityPreset = keyof typeof SENSITIVITY_PRESETS;

interface SettingsPanelProps {
  // VAD Config
  vadConfig: VadConfig;
  onUpdateVadConfig: (config: VadConfig) => void;
  // Context settings
  useSystemPrompt: boolean;
  setUseSystemPrompt: (value: boolean) => void;
  contextContent: string;
  setContextContent: (content: string) => void;
  // AI Provider settings
  allAiProviders: TYPE_PROVIDER[];
  selectedAIProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  onSetSelectedAIProvider: (data: {
    provider: string;
    variables: Record<string, string>;
  }) => void;
}

export const SettingsPanel = ({
  vadConfig,
  onUpdateVadConfig,
  useSystemPrompt,
  setUseSystemPrompt,
  contextContent,
  setContextContent,
  allAiProviders,
  selectedAIProvider,
  onSetSelectedAIProvider,
}: SettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // System prompt switcher (closes #192). Uses the same hook the
  // dashboard uses, so changes are persisted to localStorage and
  // reflected in the System Prompts page automatically.
  const {
    prompts,
    selectedPromptId,
    handleSelectPrompt,
    clearSelection,
  } = useSystemPrompts();

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Determine current sensitivity preset based on values
  const getCurrentPreset = (): SensitivityPreset | "custom" => {
    for (const [key, preset] of Object.entries(SENSITIVITY_PRESETS)) {
      if (
        Math.abs(vadConfig.sensitivity_rms - preset.sensitivity_rms) < 0.001 &&
        Math.abs(vadConfig.noise_gate_threshold - preset.noise_gate_threshold) <
        0.001
      ) {
        return key as SensitivityPreset;
      }
    }
    return "custom";
  };

  const currentPreset = getCurrentPreset();

  const handlePresetChange = (preset: SensitivityPreset) => {
    const presetValues = SENSITIVITY_PRESETS[preset];
    onUpdateVadConfig({
      ...vadConfig,
      sensitivity_rms: presetValues.sensitivity_rms,
      noise_gate_threshold: presetValues.noise_gate_threshold,
    });
  };

  const handleTemplateSelection = (templateId: string) => {
    const template = getPromptTemplateById(templateId);
    if (template) {
      setContextContent(template.prompt);
      setSelectedTemplate("");
    }
  };

  const handleResetDefaults = () => {
    const defaultConfig: VadConfig = {
      enabled: vadConfig.enabled, // Keep current mode
      hop_size: 1024,
      sensitivity_rms: 0.012,
      peak_threshold: 0.035,
      silence_chunks: 45,
      min_speech_chunks: 7,
      pre_speech_chunks: 12,
      noise_gate_threshold: 0.003,
      max_recording_duration_secs: 180,
    };
    onUpdateVadConfig(defaultConfig);
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
      {/* Settings Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Settings</span>
        </div>
        <ChevronDownIcon
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Settings Content */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-4">
          {/* Recording Settings Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Recording
            </h4>

            {/* Sensitivity Presets - Only for VAD mode */}
            {vadConfig.enabled && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Speech Sensitivity
                </Label>
                <div className="flex gap-2">
                  {(
                    Object.entries(SENSITIVITY_PRESETS) as [
                      SensitivityPreset,
                      (typeof SENSITIVITY_PRESETS)[SensitivityPreset]
                    ][]
                  ).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetChange(key)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                        currentPreset === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-accent"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {currentPreset === "custom"
                    ? "Custom sensitivity values"
                    : SENSITIVITY_PRESETS[currentPreset as SensitivityPreset]
                      .description}
                </p>
              </div>
            )}

            {/* Max Duration - Only for Manual mode */}
            {!vadConfig.enabled && (
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center justify-between">
                  <span>Max Recording Duration</span>
                  <span className="text-muted-foreground font-normal">
                    {Math.round(vadConfig.max_recording_duration_secs / 60)} min
                  </span>
                </Label>
                <Slider
                  value={[vadConfig.max_recording_duration_secs / 60]}
                  onValueChange={([value]) =>
                    onUpdateVadConfig({
                      ...vadConfig,
                      max_recording_duration_secs: Math.round(value * 60),
                    })
                  }
                  min={1}
                  max={3}
                  step={0.5}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Context Section */}
          <div className="space-y-3 pt-3 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              AI Configuration
            </h4>

            {/* System Prompt Selector — closes #192 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">System Prompt</Label>
              <Select
                value={
                  selectedPromptId !== null
                    ? selectedPromptId.toString()
                    : PROMPT_NONE_VALUE
                }
                onValueChange={(value) => {
                  if (value === PROMPT_NONE_VALUE) {
                    clearSelection();
                  } else {
                    handleSelectPrompt(Number(value));
                  }
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select System Prompt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="text-xs py-1">
                      Active Prompt
                    </SelectLabel>
                    <SelectItem
                      key={PROMPT_NONE_VALUE}
                      value={PROMPT_NONE_VALUE}
                      className="text-xs"
                    >
                      (none) — use default
                    </SelectItem>
                    {prompts.map((prompt) => (
                      <SelectItem
                        key={prompt.id}
                        value={prompt.id.toString()}
                        className="text-xs"
                      >
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {prompts.length === 0 && (
                <p className="text-[10px] text-muted-foreground">
                  No saved prompts yet. Create them in Dashboard →
                  System Prompts.
                </p>
              )}
            </div>

            {/* Provider Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">AI Model</Label>
              <Select
                value={selectedAIProvider.provider}
                onValueChange={(value) =>
                  onSetSelectedAIProvider({ provider: value, variables: {} })
                }
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="text-xs py-1">
                      Available Models
                    </SelectLabel>
                    {allAiProviders.map((provider) => {
                      if (!provider.id) return null;
                      const displayName =
                        provider.id.charAt(0).toUpperCase() +
                        provider.id.slice(1);
                      return (
                        <SelectItem
                          key={provider.id}
                          value={provider.id}
                          className="text-xs"
                        >
                          {displayName}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Context
              </Label>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-xs font-medium">Use System Prompt</Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {useSystemPrompt
                      ? "Using default prompt from settings"
                      : "Using custom context below"}
                  </p>
                </div>
                <Switch
                  checked={useSystemPrompt}
                  onCheckedChange={setUseSystemPrompt}
                />
              </div>
            </div>

            {/* Custom Context */}
            {!useSystemPrompt && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateSelection}
                  >
                    <SelectTrigger className="w-auto h-7 text-xs">
                      <WandIcon className="w-3 h-3 mr-1.5" />
                      <SelectValue placeholder="Templates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="text-xs py-1">
                          Quick-fill a template
                        </SelectLabel>
                        {PROMPT_TEMPLATES.map((template) => (
                          <SelectItem
                            key={template.id}
                            value={template.id}
                            className="text-xs"
                          >
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Enter custom system prompt and context..."
                  value={contextContent}
                  onChange={(e) => setContextContent(e.target.value)}
                  className="min-h-24 resize-none text-xs"
                />
              </div>
            )}
          </div>

          {/* Advanced Settings Toggle */}
          <div className="pt-3 border-t border-border/50">
            <button
              type="button"
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>Advanced Settings</span>
              {showAdvanced ? (
                <ChevronUpIcon className="w-3 h-3" />
              ) : (
                <ChevronDownIcon className="w-3 h-3" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3">
                {/* VAD-specific advanced settings */}
                {vadConfig.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center justify-between">
                        <span>Speech Sensitivity (Raw)</span>
                        <span className="text-muted-foreground font-normal">
                          {(vadConfig.sensitivity_rms * 1000).toFixed(1)}
                        </span>
                      </Label>
                      <Slider
                        value={[vadConfig.sensitivity_rms * 1000]}
                        onValueChange={([value]) =>
                          onUpdateVadConfig({
                            ...vadConfig,
                            sensitivity_rms: value / 1000,
                          })
                        }
                        min={1}
                        max={20}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center justify-between">
                        <span>Silence Duration</span>
                        <span className="text-muted-foreground font-normal">
                          {(
                            (vadConfig.silence_chunks * vadConfig.hop_size) /
                            44100
                          ).toFixed(1)}
                          s
                        </span>
                      </Label>
                      <Slider
                        value={[vadConfig.silence_chunks]}
                        onValueChange={([value]) =>
                          onUpdateVadConfig({
                            ...vadConfig,
                            silence_chunks: Math.round(value),
                          })
                        }
                        min={20}
                        max={180}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        How long to wait after speech stops
                      </p>
                    </div>
                  </>
                )}

                {/* Noise gate - both modes */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center justify-between">
                    <span>Noise Gate</span>
                    <span className="text-muted-foreground font-normal">
                      {(vadConfig.noise_gate_threshold * 1000).toFixed(1)}
                    </span>
                  </Label>
                  <Slider
                    value={[vadConfig.noise_gate_threshold * 1000]}
                    onValueChange={([value]) =>
                      onUpdateVadConfig({
                        ...vadConfig,
                        noise_gate_threshold: value / 1000,
                      })
                    }
                    min={0}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Filters background noise
                  </p>
                </div>

                {/* Reset button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDefaults}
                  className="w-full text-xs"
                >
                  <RotateCcwIcon className="w-3 h-3 mr-1.5" />
                  Reset to Defaults
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
