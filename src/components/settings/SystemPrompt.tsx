import { Header, Textarea } from "@/components";
import { STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "@/lib";
import { UseSettingsReturn } from "@/types";

export const SystemPrompt = ({
  systemPrompt,
  setSystemPrompt,
}: UseSettingsReturn) => {
  return (
    <div className="space-y-3">
      <Header
        title="System Prompt"
        description="Define the AI's behavior and personality. This message sets the context for all conversations."
        isMainTitle
      />

      <div className="space-y-2">
        <Textarea
          placeholder="You are a helpful AI assistant. Be concise, accurate, and friendly in your responses..."
          value={systemPrompt}
          onChange={(e) => {
            setSystemPrompt(e.target.value);
            safeLocalStorage.setItem(
              STORAGE_KEYS.SYSTEM_PROMPT,
              e.target.value
            );
          }}
          className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
        />
        <p className="text-xs text-muted-foreground/70">
          💡 Tip: Be specific about tone, expertise level, and response format
        </p>
      </div>
    </div>
  );
};
