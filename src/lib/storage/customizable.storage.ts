import { STORAGE_KEYS } from "@/config";

export interface CustomizableState {
  appIcon: {
    isVisible: boolean;
  };
  alwaysOnTop: {
    isEnabled: boolean;
  };
  titles: {
    isEnabled: boolean;
  };
  showChatWhenTyping: {
    isEnabled: boolean;
  };
}

export const DEFAULT_CUSTOMIZABLE_STATE: CustomizableState = {
  appIcon: { isVisible: true },
  alwaysOnTop: { isEnabled: false },
  titles: { isEnabled: true },
  showChatWhenTyping: { isEnabled: false },
};

/**
 * Get customizable state from localStorage
 */
export const getCustomizableState = (): CustomizableState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMIZABLE);
    return stored ? JSON.parse(stored) : DEFAULT_CUSTOMIZABLE_STATE;
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
  const newState = { ...currentState, appIcon: { isVisible } };
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
 * Update titles visibility
 */
export const updateTitlesVisibility = (
  isEnabled: boolean
): CustomizableState => {
  const currentState = getCustomizableState();
  const newState = { ...currentState, titles: { isEnabled } };
  setCustomizableState(newState);
  return newState;
};

/**
 * Update show chat when typing state
 * */
export const updateShowChatWhenTyping = (
  isEnabled: boolean
): CustomizableState => {
  const currentState = getCustomizableState();
  const newState = { ...currentState, showChatWhenTyping: { isEnabled } };
  setCustomizableState(newState);
  return newState;
};
