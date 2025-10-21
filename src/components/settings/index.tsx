import { useSettings } from "@/hooks";
import { SettingsIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { Disclaimer } from "./Disclaimer";
import { SystemPrompt } from "./system-prompt";
import { ScreenshotConfigs } from "./ScreenshotConfigs";
import { AudioSelection } from "./AudioSelection";
import { AutostartToggle } from "./AutostartToggle";
import { AppIconToggle } from "./AppIconToggle";
import { AlwaysOnTopToggle } from "./AlwaysOnTopToggle";
import { TitleToggle } from "./TitleToggle";
import { AIProviders } from "./ai-configs";
import { STTProviders } from "./stt-configs";
import { DeleteChats } from "./DeleteChats";
import { ShortcutManager } from "./shortcuts";
import Theme from "./Theme";
import { SettingsNavigation } from "./SettingsNavigation";

export const Settings = () => {
  const settings = useSettings();

  return (
    <Popover
      open={settings?.isPopoverOpen}
      onOpenChange={settings?.setIsPopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon"
          aria-label="Open Settings"
          className="cursor-pointer"
          title="Open Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      {/* Settings Panel */}
      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 border overflow-hidden border-input/50"
        sideOffset={8}
      >
        <ScrollArea className="h-[calc(100vh-7.2rem)]">
          <div className="p-6 space-y-6">
            {/* Settings Navigation */}
            <SettingsNavigation />

            {/* System Prompt */}
            <SystemPrompt {...settings} />

            {/* Theme */}
            <Theme />

            {/* Screenshot Configs */}
            <ScreenshotConfigs {...settings} />

            {/* Keyboard Shortcuts */}
            <ShortcutManager />

            {/* Audio Selection */}
            <AudioSelection />

            {/* Autostart Toggle */}
            <AutostartToggle />

            {/* App Icon Toggle */}
            <AppIconToggle />

            {/* Always On Top Toggle */}
            <AlwaysOnTopToggle />

            {/* Title Toggle */}
            <TitleToggle />

            {/* Provider Selection */}
            <AIProviders {...settings} />

            {/* STT Providers */}
            <STTProviders {...settings} />

            {/* Delete Chat History */}
            <DeleteChats {...settings} />
          </div>

          <div className="pt-2 pb-6 flex items-center justify-center">
            <a
              href="https://www.srikanthnani.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground text-center font-medium"
            >
              🚀 Built by Srikanth Nani ✨
            </a>
          </div>
        </ScrollArea>

        <div className="border-t border-input/50">
          <Disclaimer />
        </div>
      </PopoverContent>
    </Popover>
  );
};
