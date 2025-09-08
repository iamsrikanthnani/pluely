import { Switch, Label, Header, Slider } from "@/components";
import { useApp } from "@/contexts";
import { cn } from "@/lib/utils";

interface TransparencyToggleProps {
  className?: string;
}

export const TransparencyToggle = ({ className }: TransparencyToggleProps) => {
  const { customizable, toggleTransparency, updateTransparencyOpacity, togglePopoverTrigger, updatePopoverTriggerOpacityValue } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleTransparency(checked);
  };

  const handleOpacityChange = async (value: number[]) => {
    const opacity = value[0] / 100; // Convert percentage to decimal
    await updateTransparencyOpacity(opacity);
  };

  const handlePopoverOpacityChange = async (value: number[]) => {
    const opacity = value[0] / 100;
    await updatePopoverTriggerOpacityValue(opacity);
  };

  const transparencyPresets = [
    { name: "Opaque", value: 100, description: "No transparency" },
    { name: "Subtle", value: 90, description: "Slight transparency" },
    { name: "Medium", value: 80, description: "Moderate transparency" },
    { name: "High", value: 70, description: "High transparency" },
    { name: "Glass", value: 60, description: "Glass-like effect" },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <Header
        title="Window Transparency"
        description="Control window transparency and opacity for a modern glass-like appearance"
        isMainTitle
      />
      
      {/* Enable/Disable Transparency Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {customizable?.transparency?.isEnabled
                ? "Disable Transparency"
                : "Enable Transparency"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {customizable?.transparency?.isEnabled
                ? "Window has transparency effects enabled"
                : "Window uses solid background"}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable?.transparency?.isEnabled ?? true}
          onCheckedChange={handleSwitchChange}
          title={`Toggle to ${
            !customizable?.transparency?.isEnabled ? "Enable" : "Disable"
          } transparency`}
          aria-label={`Toggle to ${
            customizable?.transparency?.isEnabled ? "Enable" : "Disable"
          } transparency`}
        />
      </div>

      {/* Opacity Control */}
      {customizable?.transparency?.isEnabled && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Opacity Level</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round((customizable?.transparency?.opacity ?? 0.8) * 100)}%
            </span>
          </div>
          
          <Slider
            value={[(customizable?.transparency?.opacity ?? 0.8) * 100]}
            onValueChange={handleOpacityChange}
            max={100}
            min={20}
            step={5}
            className="w-full"
            disabled={!customizable?.transparency?.isEnabled}
          />
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {transparencyPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleOpacityChange([preset.value])}
                className={cn(
                  "px-2 py-1 text-xs rounded-md border transition-colors",
                  Math.round((customizable?.transparency?.opacity ?? 0.8) * 100) === preset.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                )}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Tip: Lower opacity creates a more glass-like effect, while higher opacity maintains better readability
          </p>
        </div>
      )}

      {/* Popover Trigger Transparency */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Popover Trigger Transparency</Label>
          <Switch
            checked={customizable?.popoverTrigger?.isEnabled ?? true}
            onCheckedChange={togglePopoverTrigger}
          />
        </div>

        {customizable?.popoverTrigger?.isEnabled && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Trigger Opacity</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round((customizable?.popoverTrigger?.opacity ?? 0.25) * 100)}%
              </span>
            </div>
            <Slider
              value={[(customizable?.popoverTrigger?.opacity ?? 0.25) * 100]}
              onValueChange={handlePopoverOpacityChange}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
          </>
        )}
      </div>
    </div>
  );
};
