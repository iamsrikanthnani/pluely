import { useSettings } from "@/hooks";
import { SettingsIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
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
import { PluelyApiSetup } from "./PluelyApiSetup";
import { ShortcutManager } from "./shortcuts";
import Theme from "./Theme";
import { CursorSelection } from "./Cursor";

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
        <Tabs defaultValue="general" className="w-full">
          <div className="border-b border-input/50 px-4 pt-4">
            <TabsList className="w-full grid grid-cols-7 h-auto">
              <TabsTrigger value="general" className="text-xs px-2 py-2">
                General
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs px-2 py-2">
                AI Models
              </TabsTrigger>
              <TabsTrigger value="stt" className="text-xs px-2 py-2">
                Speech-to-Text
              </TabsTrigger>
              <TabsTrigger value="prompts" className="text-xs px-2 py-2">
                Prompts
              </TabsTrigger>
              <TabsTrigger value="screenshot" className="text-xs px-2 py-2">
                Screenshot
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="text-xs px-2 py-2">
                Shortcuts
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs px-2 py-2">
                Advance
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-11rem)]">
            <div className="p-6">
              <TabsContent value="general" className="space-y-6 mt-0">
                {/* Pluely API Setup */}
                <PluelyApiSetup />
                {/* Audio Selection */}
                <AudioSelection />
                {/* Delete Chat History */}
                <DeleteChats {...settings} />
              </TabsContent>

              <TabsContent value="ai" className="space-y-6 mt-0">
                {/* Provider Selection */}
                <AIProviders {...settings} />
              </TabsContent>

              <TabsContent value="stt" className="space-y-6 mt-0">
                {/* STT Providers */}
                <STTProviders {...settings} />
              </TabsContent>

              <TabsContent value="prompts" className="space-y-6 mt-0">
                {/* System Prompt */}
                <SystemPrompt {...settings} />
              </TabsContent>

              <TabsContent value="screenshot" className="space-y-6 mt-0">
                {/* Screenshot Configs */}
                <ScreenshotConfigs {...settings} />
              </TabsContent>

              <TabsContent value="shortcuts" className="space-y-6 mt-0">
                {/* Keyboard Shortcuts */}
                <ShortcutManager />
              </TabsContent>

              <TabsContent value="data" className="space-y-6 mt-0">
                {/* Theme */}
                <Theme />
                {/* Cursor Selection */}
                <CursorSelection />
                {/* Autostart Toggle */}
                <AutostartToggle />
                {/* App Icon Toggle */}
                <AppIconToggle />
                {/* Always On Top Toggle */}
                <AlwaysOnTopToggle />
                {/* Title Toggle */}
                <TitleToggle />
              </TabsContent>
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
        </Tabs>

        <div className="border-t border-input/50">
          <Disclaimer />
        </div>
      </PopoverContent>
    </Popover>
  );
};
