import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Switch,
  Header,
} from "@/components";
import { UseSettingsReturn } from "@/types";

export const ScreenshotConfigs = ({
  screenshotConfiguration,
  handleScreenshotModeChange,
  handleScreenshotPromptChange,
  handleScreenshotEnabledChange,
}: UseSettingsReturn) => {
  return (
    <div className="space-y-3">
      <Header
        title="Screenshot Configuration"
        description="Configure how screenshots are handled - automatically submit to AI or manual mode."
        isMainTitle
      />

      <div className="space-y-3">
        {/* Enable/Disable Screenshot Feature */}
        <div className="flex items-center justify-between">
          <Header
            title="Enable Screenshots"
            description="Allow taking screenshots in the application"
          />
          <Switch
            checked={screenshotConfiguration.enabled}
            onCheckedChange={handleScreenshotEnabledChange}
          />
        </div>

        {/* Only show configuration options when screenshots are enabled */}
        {screenshotConfiguration.enabled && (
          <>
            {/* Mode Selection */}
            <div className="space-y-2">
              <div className="flex flex-col">
                <Header
                  title="Screenshot Mode"
                  description={
                    screenshotConfiguration.mode === "manual"
                      ? "Screenshots will be captured and automatically added to your attached files. You can then submit them with your own prompt."
                      : "Screenshots will be automatically submitted to AI using your custom prompt. No manual intervention required."
                  }
                />
              </div>
              <Select
                value={screenshotConfiguration.mode}
                onValueChange={handleScreenshotModeChange}
              >
                <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {screenshotConfiguration.mode === "auto"
                        ? "Auto"
                        : "Manual"}{" "}
                      Mode
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <div className="font-medium">Manual Mode</div>
                  </SelectItem>
                  <SelectItem value="auto">
                    <div className="font-medium">Auto Mode</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Prompt Input - Only show when auto mode is selected */}
            {screenshotConfiguration.mode === "auto" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Auto Prompt</Label>
                <Input
                  placeholder="Enter prompt for automatic screenshot analysis..."
                  value={screenshotConfiguration.autoPrompt}
                  onChange={(e) => handleScreenshotPromptChange(e.target.value)}
                  className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will be used automatically when screenshots are
                  taken
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tips - only show when screenshots are enabled */}
      {screenshotConfiguration.enabled && (
        <div className="text-xs text-muted-foreground/70">
          <p>
            💡 <strong>Tip:</strong> Auto mode is great for quick analysis,
            manual mode gives you more control. Screenshots are limited to 1 at
            a time to maintain clarity
          </p>
        </div>
      )}
    </div>
  );
};
