import { Button } from "@/components";

const SETTINGS_SECTIONS = [
  { id: "system-prompt", label: "System prompt" },
  { id: "theme", label: "Theme" },
  { id: "screenshot", label: "Screenshot config" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "audio", label: "Audio devices" },
  { id: "autostart", label: "App startup" },
  { id: "app-icon", label: "App icon" },
  { id: "always-on-top", label: "Always on top" },
  { id: "titles", label: "Element titles" },
  { id: "ai-providers", label: "AI providers" },
  { id: "stt-providers", label: "STT providers" },
  { id: "delete-chats", label: "Delete chat history" },
];

export const SettingsNavigation = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="space-y-1 -mt-2">
      <p className="text-xs text-muted-foreground">Quick Jump to:</p>
      <div className="flex flex-wrap items-center gap-2">
        {SETTINGS_SECTIONS.map((section) => {
          return (
            <Button
              key={section.id}
              size="sm"
              variant="outline"
              onClick={() => scrollToSection(section.id)}
              className="h-fit px-2.5 py-1"
              title={`Jump to ${section.label} section`}
            >
              <span className="text-[10px]">{section.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
