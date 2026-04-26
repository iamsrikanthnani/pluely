import { Card, Header } from "@/components";
import { RESPONSE_LENGTHS } from "@/lib";
import { updateResponseLength } from "@/lib/storage/response-settings.storage";
import { useState, useEffect } from "react";
import { getResponseSettings } from "@/lib";
import { CheckCircle2 } from "lucide-react";

export const ResponseLength = () => {
  const [selectedLength, setSelectedLength] = useState<string>("auto");

  useEffect(() => {
    const settings = getResponseSettings();
    setSelectedLength(settings.responseLength);
  }, []);

  const handleLengthChange = (lengthId: string) => {
    setSelectedLength(lengthId);
    updateResponseLength(lengthId);
  };

  return (
    <div className="space-y-4">
      <Header
        title="Response Length"
        description="Control how detailed the AI responses should be. Changes apply to all new conversations and will influence how the AI structures responses"
        isMainTitle
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RESPONSE_LENGTHS.map((length) => (
          <Card
            key={length.id}
            className={`relative p-4 border lg:border-2 shadow-none cursor-pointer transition-all ${
              selectedLength === length.id
                ? "border-primary"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handleLengthChange(length.id)}
          >
            <div className="space-y-1">
              <h3 className="text-sm lg:text-md font-semibold">
                {length.title}
              </h3>
              <p className="text-[10px] lg:text-xs text-muted-foreground">
                {length.description}
              </p>
            </div>
            {selectedLength === length.id && (
              <CheckCircle2 className="size-5 text-green-500 flex-shrink-0 absolute top-2 right-2" />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
