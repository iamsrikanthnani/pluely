import { Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTextToSpeech } from "@/hooks";
import { Button } from "@/components/ui/button";

type SpeakButtonProps = {
  content: string;
};

export function SpeakButton({ content }: SpeakButtonProps) {
  const { isSupported, isSpeaking, speak } = useTextToSpeech();

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-6 w-6"
      aria-label={isSpeaking ? "Stop reading aloud" : "Read aloud"}
      title={isSpeaking ? "Stop reading aloud" : "Read aloud"}
      onClick={() => speak(content)}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Square
          className={cn(
            "h-3.5 w-3.5 transition-transform ease-in-out fill-current",
            isSpeaking ? "scale-100" : "scale-0"
          )}
        />
      </div>
      <Volume2
        className={cn(
          "h-4 w-4 transition-transform ease-in-out",
          isSpeaking ? "scale-0" : "scale-100"
        )}
      />
    </Button>
  );
}
