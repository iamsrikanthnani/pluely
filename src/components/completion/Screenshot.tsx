import { Button } from "../ui/button";
import { LaptopMinimalIcon, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { UseCompletionReturn } from "@/types";
import { MAX_FILES } from "@/config";
import { useState } from "react";

export const Screenshot = ({
  screenshotConfiguration,
  handleScreenshotSubmit,
  attachedFiles,
  isLoading,
}: UseCompletionReturn) => {
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const captureScreenshot = async () => {
    if (!screenshotConfiguration.enabled || !handleScreenshotSubmit) return;
    setIsScreenshotLoading(true);
    try {
      const base64 = await invoke("capture_to_base64");

      if (screenshotConfiguration.mode === "auto") {
        // Auto mode: Submit directly to AI with the configured prompt
        handleScreenshotSubmit(
          base64 as string,
          screenshotConfiguration.autoPrompt
        );
      } else if (screenshotConfiguration.mode === "manual") {
        // Manual mode: Add to attached files without prompt
        handleScreenshotSubmit(base64 as string);
      }
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    } finally {
      setIsScreenshotLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        size="icon"
        className="cursor-pointer"
        title={
          screenshotConfiguration.enabled
            ? `Capture live screenshot (${screenshotConfiguration.mode} mode) ${attachedFiles.length}/${MAX_FILES}`
            : "Screenshots disabled in settings"
        }
        onClick={captureScreenshot}
        disabled={
          !screenshotConfiguration.enabled ||
          attachedFiles.length >= MAX_FILES ||
          isScreenshotLoading ||
          isLoading
        }
      >
        {isScreenshotLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LaptopMinimalIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Disabled state indicator */}
      {!screenshotConfiguration.enabled && (
        <div className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full h-5 w-5 flex border border-muted items-center justify-center text-xs font-medium">
          ✕
        </div>
      )}
    </div>
  );
};
