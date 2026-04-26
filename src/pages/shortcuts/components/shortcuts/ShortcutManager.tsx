import { useState, useEffect } from "react";
import { Button, Card, Switch } from "@/components";
import { RotateCcw, AlertCircle, Keyboard } from "lucide-react";
import {
  getAllShortcutActions,
  getShortcutsConfig,
  updateShortcutBinding,
  resetShortcutsToDefaults,
  checkShortcutConflicts,
  formatShortcutKeyForDisplay,
  getPlatformDefaultKey,
} from "@/lib";
import { ShortcutAction, ShortcutBinding } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { ShortcutRecorder } from "./ShortcutRecorder";

export const ShortcutManager = () => {
  const [actions, setActions] = useState<ShortcutAction[]>([]);
  const [bindings, setBindings] = useState<Record<string, ShortcutBinding>>({});
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = () => {
    const config = getShortcutsConfig();
    const allActions = getAllShortcutActions(true);
    setActions(allActions);
    setBindings(config.bindings);
  };

  const handleToggleEnabled = async (actionId: string, enabled: boolean) => {
    const binding = bindings[actionId];
    if (!binding) return;

    const newBinding = { ...binding, enabled };
    const updatedBindings = { ...bindings, [actionId]: newBinding };
    setBindings(updatedBindings);

    // Update storage
    updateShortcutBinding(actionId, binding.key, enabled);

    // Apply to backend
    await applyShortcuts(updatedBindings);
  };

  const handleSaveShortcut = async (actionId: string, key: string) => {
    // Check for conflicts
    const conflict = checkShortcutConflicts(key, actionId);
    if (conflict) {
      setConflicts([
        `Shortcut "${key}" is already used by: ${conflict.actions
          .map((id) => actions.find((a) => a.id === id)?.name)
          .join(", ")}`,
      ]);
      return;
    }

    const binding = bindings[actionId] || {
      action: actionId,
      key: "",
      enabled: true,
    };
    const newBinding = { ...binding, key };
    const updatedBindings = { ...bindings, [actionId]: newBinding };
    setBindings(updatedBindings);

    // Update storage
    updateShortcutBinding(actionId, key, binding.enabled);

    // Apply to backend
    await applyShortcuts(updatedBindings);

    // Close editor and clear conflicts
    setEditingAction(null);
    setConflicts([]);
  };

  const applyShortcuts = async (
    updatedBindings: Record<string, ShortcutBinding>
  ) => {
    setIsApplying(true);
    try {
      await invoke("update_shortcuts", {
        config: { bindings: updatedBindings },
      });
    } catch (error) {
      console.error("Failed to apply shortcuts:", error);
      setConflicts([`Failed to apply shortcuts: ${error}`]);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = async () => {
    setIsApplying(true);
    try {
      const defaultConfig = resetShortcutsToDefaults();

      await applyShortcuts(defaultConfig.bindings);

      setBindings(defaultConfig.bindings);
      setConflicts([]);
      setEditingAction(null);

      // Reload to ensure fresh state
      loadShortcuts();
    } catch (error) {
      console.error("Failed to reset shortcuts:", error);
      setConflicts(["Failed to reset shortcuts. Please try again."]);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div id="shortcuts" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md lg:text-lg font-semibold flex items-center gap-2">
            <Keyboard className="size-5 lg:size-5" />
            Keyboard Shortcuts
          </h3>
          <p className="text-sm text-muted-foreground">
            {actions.length} shortcut{actions.length !== 1 ? "s" : ""}{" "}
            configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={isApplying}
            title="Reset all shortcuts to platform defaults"
          >
            <RotateCcw className="size-3 lg:size-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-3 lg:size-4 text-destructive mt-0.5" />
            <div className="flex-1">
              {conflicts.map((conflict, i) => (
                <p key={i} className="text-sm text-destructive">
                  {conflict}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Flat Shortcuts List */}
      <div className="space-y-3">
        {actions.map((action) => {
          const binding = bindings[action.id] || {
            action: action.id,
            key: getPlatformDefaultKey(action),
            enabled: true,
          };
          const isEditing = editingAction === action.id;

          return (
            <Card
              key={action.id}
              className={`shadow-none p-4 border border-border/70 rounded-xl ${
                !binding.enabled ? "opacity-50" : ""
              }`}
            >
              {isEditing ? (
                // EDITING MODE - Show recorder immediately
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-xs lg:text-sm">
                      {action.name}
                    </p>
                    <p className="text-[10px] lg:text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ShortcutRecorder
                    actionId={action.id}
                    onSave={(key) => handleSaveShortcut(action.id, key)}
                    onCancel={() => {
                      setEditingAction(null);
                      setConflicts([]);
                    }}
                    disabled={isApplying}
                  />
                </div>
              ) : (
                // VIEW MODE - Show shortcut with controls
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <Switch
                      checked={binding.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleEnabled(action.id, enabled)
                      }
                      disabled={isApplying}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-xs lg:text-sm">
                        {action.name}
                      </p>
                    </div>
                    <p className="text-[10px] lg:text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1.5 bg-muted rounded text-xs lg:text-sm font-mono">
                      {action.id === "move_window"
                        ? `${formatShortcutKeyForDisplay(
                            binding.key
                          )} + (← ↑ ↓ →)`
                        : formatShortcutKeyForDisplay(binding.key)}
                    </code>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setEditingAction(action.id);
                        setConflicts([]);
                      }}
                      disabled={isApplying}
                      className="min-w-[80px]"
                      title="Change this shortcut"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        💡 Shortcuts work globally, even when the app is hidden
      </p>
    </div>
  );
};
