import { useEffect, useState } from "react";
import { Button } from "@/components";
import {
  CheckCircle2Icon,
  LoaderIcon,
  ShieldAlertIcon,
  ChevronDownIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";

interface PermissionFlowProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

type PermissionState = "checking" | "granted" | "denied" | "requesting";

export const PermissionFlow = ({
  onPermissionGranted,
  onPermissionDenied,
}: PermissionFlowProps) => {
  const [permissionState, setPermissionState] =
    useState<PermissionState>("checking");
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      setPermissionState("checking");
      const hasAccess = await invoke<boolean>("check_system_audio_access");

      if (hasAccess) {
        setPermissionState("granted");
        setTimeout(() => onPermissionGranted(), 500);
      } else {
        setPermissionState("denied");
        onPermissionDenied();
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      setPermissionState("denied");
      onPermissionDenied();
    }
  };

  const requestPermission = async () => {
    try {
      setPermissionState("requesting");
      await invoke("request_system_audio_access");

      let attempts = 0;
      const maxAttempts = 20;

      const pollInterval = setInterval(async () => {
        attempts++;
        setCheckAttempts(attempts);

        try {
          const hasAccess = await invoke<boolean>("check_system_audio_access");

          if (hasAccess) {
            clearInterval(pollInterval);
            setPermissionState("granted");
            setTimeout(() => onPermissionGranted(), 500);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPermissionState("denied");
            onPermissionDenied();
          }
        } catch (error) {
          console.error("Permission poll failed:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Permission request failed:", error);
      setPermissionState("denied");
      onPermissionDenied();
    }
  };

  const stateConfig = {
    checking: {
      icon: <LoaderIcon className="w-5 h-5 animate-spin" />,
      title: "Checking Permissions",
      description: "Verifying system audio access...",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      titleColor: "text-blue-900",
    },
    granted: {
      icon: <CheckCircle2Icon className="w-5 h-5" />,
      title: "Permission Granted",
      description: "Starting capture...",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      titleColor: "text-green-900",
    },
    requesting: {
      icon: <LoaderIcon className="w-5 h-5 animate-spin" />,
      title: "Waiting for Permission",
      description: `Enable Nluely in System Settings (${checkAttempts}/20)`,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
      titleColor: "text-orange-900",
    },
    denied: {
      icon: <ShieldAlertIcon className="w-5 h-5" />,
      title: "Permission Required",
      description: "Grant access to capture system audio",
      bgColor: "bg-muted/50",
      borderColor: "border-border",
      textColor: "text-muted-foreground",
      titleColor: "text-foreground",
    },
  };

  const config = stateConfig[permissionState];

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0", config.textColor)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-sm mb-0.5", config.titleColor)}>
            {config.title}
          </h3>
          <p className={cn("text-xs", config.textColor)}>{config.description}</p>

          {permissionState === "denied" && (
            <div className="mt-3 space-y-2">
              <Button onClick={requestPermission} size="sm" className="w-full">
                Grant Permission
              </Button>
              <button
                type="button"
                onClick={() => setShowManual(!showManual)}
                className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Manual setup
                <ChevronDownIcon
                  className={cn(
                    "w-3 h-3 transition-transform",
                    showManual && "rotate-180"
                  )}
                />
              </button>
              {showManual && (
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside pt-2 border-t border-border/50">
                  <li>Open System Settings</li>
                  <li>Go to Privacy & Security</li>
                  <li>Select Screen & System Audio Recording</li>
                  <li>Enable Nluely</li>
                </ol>
              )}
            </div>
          )}

          {permissionState === "requesting" && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkPermission}
                className="text-xs"
              >
                Check Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
