import { STORAGE_KEYS } from "@/config";
import type { AppIconId } from "@/lib/app-icons";

export type CursorType = "invisible" | "default" | "auto";

export interface CustomizableState {
  appIcon: {
    isVisible: boolean;
    selected: AppIconId;
  };
  alwaysOnTop: {
    isEnabled: boolean;
  };
  autostart: {
    isEnabled: boolean;
  };
  cursor: {
    type: CursorType;
  };
}

export const DEFAULT_CUSTOMIZABLE_STATE: CustomizableState = {
  appIcon: { isVisible: true, selected: "sparkles" },
  alwaysOnTop: { isEnabled: false },
  autostart: { isEnabled: true },
  cursor: { type: "invisible" },
};

/**
 * Get customizable state from localStorage
 */
export const getCustomizableState = (): CustomizableState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMIZABLE);
    if (!stored) {
      return DEFAULT_CUSTOMIZABLE_STATE;
    }

    const parsedState = JSON.parse(stored);

    const appIcon =
      typeof parsedState.appIcon === "object" && parsedState.appIcon !== null
        ? parsedState.appIcon
        : {};
    const alwaysOnTop =
      typeof parsedState.alwaysOnTop === "object" &&
      parsedState.alwaysOnTop !== null
        ? parsedState.alwaysOnTop
        : {};
    const autostart =
      typeof parsedState.autostart === "object" && parsedState.autostart !== null
        ? parsedState.autostart
        : {};
    const cursor =
      typeof parsedState.cursor === "object" && parsedState.cursor !== null
        ? parsedState.cursor
        : {};

    return {
      appIcon: { ...DEFAULT_CUSTOMIZABLE_STATE.appIcon, ...appIcon },
      alwaysOnTop: { ...DEFAULT_CUSTOMIZABLE_STATE.alwaysOnTop, ...alwaysOnTop },
      autostart: { ...DEFAULT_CUSTOMIZABLE_STATE.autostart, ...autostart },
      cursor: { ...DEFAULT_CUSTOMIZABLE_STATE.cursor, ...cursor },
    };
  } catch (error) {
    console.error("Failed to get customizable state:", error);
    return DEFAULT_CUSTOMIZABLE_STATE;
  }
};

/**
 * Save customizable state to localStorage
 */
export const setCustomizableState = (state: CustomizableState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMIZABLE, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save customizable state:", error);
  }
};

/**
 * Update app icon visibility
 */
export const updateAppIconVisibility = (
  isVisible: boolean
): CustomizableState => {
  const currentState = getCustomizableState();
  const newState = {
    ...currentState,
    appIcon: { ...currentState.appIcon, isVisible },
  };
  setCustomizableState(newState);
  return newState;
};

/**
 * Update app icon selection
 */
export const updateAppIconSelection = (
  selected: AppIconId
): CustomizableState => {
  const currentState = getCustomizableState();
  const newState = {
    ...currentState,
    appIcon: { ...currentState.appIcon, selected },
  };
  setCustomizableState(newState);
  return newState;
};

/**
 * Update always on top state
 */
export const updateAlwaysOnTop = (isEnabled: boolean): CustomizableState => {
  const currentState = getCustomizableState();
  const newState = { ...currentState, alwaysOnTop: { isEnabled } };
  setCustomizableState(newState);
  return newState;
};

/**
 * Update cursor type
 */
export const updateCursorType = (type: CursorType): CustomizableState => {
  const currentState = getCustomizableState();
  const newState = { ...currentState, cursor: { type } };
  setCustomizableState(newState);
  return newState;
};

/**
 * Update autostart state
 */
export const updateAutostart = (isEnabled: boolean): CustomizableState => {
  const currentState = getCustomizableState();
  const newState = { ...currentState, autostart: { isEnabled } };
  setCustomizableState(newState);
  return newState;
};
