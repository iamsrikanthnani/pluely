import { Badge, Card } from "@/components";
import { useApp } from "@/contexts";
import { PageLayout } from "@/layouts";
import {
  APP_ICON_OPTIONS,
  getAppIconOption,
  renderAppIconPngBase64,
} from "@/lib/app-icons";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

const AppIcon = () => {
  const { customizable, setAppIconSelection } = useApp();
  const selectedOption = getAppIconOption(customizable.appIcon.selected);
  const SelectedIcon = selectedOption.icon;
  const [status, setStatus] = useState<{
    state: "idle" | "applying" | "success" | "error";
    message?: string;
  }>({ state: "idle" });

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "Failed to update dock icon.";
    }
  };

  const applyIcon = async (id: (typeof APP_ICON_OPTIONS)[number]["id"]) => {
    setStatus({ state: "applying", message: "Applying dock icon..." });
    setAppIconSelection(id);

    try {
      const pngBase64 = await renderAppIconPngBase64(id);
      await invoke("set_app_icon", { pngBase64 });
      setStatus({
        state: "success",
        message: "Dock icon updated. It may take a moment to refresh.",
      });
    } catch (error) {
      console.error("Failed to update dock icon:", error);
      setStatus({
        state: "error",
        message: getErrorMessage(error),
      });
    }
  };

  return (
    <PageLayout
      title="App Icon"
      description="Pick a built-in icon to personalize the dock/taskbar and dashboard branding."
    >
      {status.state !== "idle" && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-xs",
            status.state === "success" && "border-emerald-200 bg-emerald-50",
            status.state === "error" && "border-red-200 bg-red-50",
            status.state === "applying" && "border-amber-200 bg-amber-50"
          )}
        >
          <p
            className={cn(
              "font-medium",
              status.state === "success" && "text-emerald-700",
              status.state === "error" && "text-red-700",
              status.state === "applying" && "text-amber-700"
            )}
          >
            {status.message}
          </p>
        </div>
      )}
      <Card className="flex flex-col gap-3 p-4 shadow-none md:flex-row md:items-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <SelectedIcon className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            Current icon: {selectedOption.label}
          </p>
          <p className="text-xs text-muted-foreground">
            This icon appears in the dock/taskbar and dashboard sidebar.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {APP_ICON_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = option.id === selectedOption.id;

          return (
            <Card
              key={option.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => applyIcon(option.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  applyIcon(option.id);
                }
              }}
              className={cn(
                "relative cursor-pointer select-none gap-2 border-2 py-4 shadow-none transition-all hover:shadow-sm",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/20 hover:border-primary/30"
              )}
            >
              {isSelected ? (
                <CheckCircle2Icon className="absolute right-3 top-3 size-5 text-primary" />
              ) : null}
              <div className="flex items-center gap-3 px-4">
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 pt-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {isSelected ? "Active" : "Select"}
                </span>
                <Badge variant={isSelected ? "default" : "secondary"}>
                  {isSelected ? "Selected" : "Choose"}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
};

export default AppIcon;
