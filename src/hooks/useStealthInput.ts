/**
 * useStealthInput Hook
 *
 * This hook provides stealth input functionality for Windows.
 * When enabled, keyboard input is captured globally without the window
 * needing focus, making it undetectable by focus/blur event monitoring.
 *
 * On non-Windows platforms, this hook is a no-op and falls back to
 * normal input behavior.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Check if we're running on Windows by trying to invoke the stealth command.
 * This is more reliable than user agent sniffing in a Tauri context.
 */
const checkWindowsSupport = async (): Promise<boolean> => {
  try {
    // Try to check if stealth input is active - this will only work on Windows
    await invoke("is_stealth_input_active");
    return true;
  } catch {
    // Command doesn't exist on non-Windows platforms
    return false;
  }
};

interface UseStealthInputOptions {
  /** Called when a character is typed */
  onInput?: (char: string) => void;
  /** Called when Enter is pressed */
  onEnter?: () => void;
  /** Called when Backspace is pressed */
  onBackspace?: () => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Called when Tab is pressed */
  onTab?: () => void;
  /** Called when an arrow key is pressed */
  onArrow?: (direction: "up" | "down" | "left" | "right") => void;
  /** Whether to automatically enable stealth mode */
  autoEnable?: boolean;
}

interface UseStealthInputReturn {
  /** Whether stealth input is currently active */
  isActive: boolean;
  /** Whether we're on Windows (stealth mode supported) */
  isSupported: boolean;
  /** Enable stealth input capture */
  enable: () => Promise<void>;
  /** Disable stealth input capture */
  disable: () => Promise<void>;
  /** Toggle stealth input capture */
  toggle: () => Promise<void>;
  /** Current input buffer (accumulated text) */
  inputBuffer: string;
  /** Clear the input buffer */
  clearBuffer: () => void;
}

export const useStealthInput = (
  options: UseStealthInputOptions = {}
): UseStealthInputReturn => {
  const {
    onInput,
    onEnter,
    onBackspace,
    onEscape,
    onTab,
    onArrow,
    autoEnable = false,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [inputBuffer, setInputBuffer] = useState("");

  // Use refs to avoid stale closures in event listeners
  const onInputRef = useRef(onInput);
  const onEnterRef = useRef(onEnter);
  const onBackspaceRef = useRef(onBackspace);
  const onEscapeRef = useRef(onEscape);
  const onTabRef = useRef(onTab);
  const onArrowRef = useRef(onArrow);

  // Update refs when callbacks change
  useEffect(() => {
    onInputRef.current = onInput;
    onEnterRef.current = onEnter;
    onBackspaceRef.current = onBackspace;
    onEscapeRef.current = onEscape;
    onTabRef.current = onTab;
    onArrowRef.current = onArrow;
  }, [onInput, onEnter, onBackspace, onEscape, onTab, onArrow]);

  // Check if we're on Windows (stealth mode supported)
  useEffect(() => {
    checkWindowsSupport().then(setIsSupported);
  }, []);

  // Enable stealth input
  const enable = useCallback(async () => {
    if (!isSupported) return;

    try {
      await invoke("enable_stealth_input", { enabled: true });
      setIsActive(true);
    } catch (error) {
      console.error("[stealth] Failed to enable stealth input:", error);
    }
  }, [isSupported]);

  // Disable stealth input
  const disable = useCallback(async () => {
    if (!isSupported) return;

    try {
      await invoke("enable_stealth_input", { enabled: false });
      setIsActive(false);
    } catch (error) {
      console.error("[stealth] Failed to disable stealth input:", error);
    }
  }, [isSupported]);

  // Toggle stealth input
  const toggle = useCallback(async () => {
    if (isActive) {
      await disable();
    } else {
      await enable();
    }
  }, [isActive, enable, disable]);

  // Clear the input buffer
  const clearBuffer = useCallback(() => {
    setInputBuffer("");
  }, []);

  // Setup event listeners for stealth input events
  useEffect(() => {
    if (!isSupported) return;

    const unlisteners: UnlistenFn[] = [];

    const setupListeners = async () => {
      // Character input
      unlisteners.push(
        await listen<string>("stealth-key-input", (event) => {
          const char = event.payload;
          setInputBuffer((prev) => prev + char);
          onInputRef.current?.(char);
        })
      );

      // Enter key
      unlisteners.push(
        await listen("stealth-key-enter", () => {
          onEnterRef.current?.();
        })
      );

      // Backspace key
      unlisteners.push(
        await listen("stealth-key-backspace", () => {
          setInputBuffer((prev) => prev.slice(0, -1));
          onBackspaceRef.current?.();
        })
      );

      // Escape key
      unlisteners.push(
        await listen("stealth-key-escape", () => {
          onEscapeRef.current?.();
        })
      );

      // Tab key
      unlisteners.push(
        await listen("stealth-key-tab", () => {
          onTabRef.current?.();
        })
      );

      // Arrow keys
      unlisteners.push(
        await listen<string>("stealth-key-arrow", (event) => {
          const direction = event.payload as "up" | "down" | "left" | "right";
          onArrowRef.current?.(direction);
        })
      );
    };

    setupListeners();

    // Cleanup
    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [isSupported]);

  // Auto-enable if requested
  useEffect(() => {
    if (autoEnable && isSupported && !isActive) {
      enable();
    }
  }, [autoEnable, isSupported, isActive, enable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        invoke("enable_stealth_input", { enabled: false }).catch(() => {});
      }
    };
  }, [isActive]);

  return {
    isActive,
    isSupported,
    enable,
    disable,
    toggle,
    inputBuffer,
    clearBuffer,
  };
};

/**
 * Higher-level hook that manages an input field with stealth mode support.
 * This automatically handles the input buffer and syncs it with a controlled value.
 */
interface UseStealthInputFieldOptions {
  /** Initial value */
  initialValue?: string;
  /** Called when value changes */
  onChange?: (value: string) => void;
  /** Called when Enter is pressed */
  onSubmit?: (value: string) => void;
  /** Called when Escape is pressed */
  onCancel?: () => void;
}

interface UseStealthInputFieldReturn {
  /** Current input value */
  value: string;
  /** Set the input value */
  setValue: (value: string) => void;
  /** Whether stealth mode is active */
  isStealthActive: boolean;
  /** Whether stealth mode is supported */
  isStealthSupported: boolean;
  /** Enable stealth mode */
  enableStealth: () => Promise<void>;
  /** Disable stealth mode */
  disableStealth: () => Promise<void>;
  /** Clear the input */
  clear: () => void;
}

export const useStealthInputField = (
  options: UseStealthInputFieldOptions = {}
): UseStealthInputFieldReturn => {
  const { initialValue = "", onChange, onSubmit, onCancel } = options;

  const [value, setValueInternal] = useState(initialValue);

  const setValue = useCallback(
    (newValue: string) => {
      setValueInternal(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const {
    isActive,
    isSupported,
    enable,
    disable,
    clearBuffer,
  } = useStealthInput({
    onInput: (char) => {
      setValue(value + char);
    },
    onBackspace: () => {
      setValue(value.slice(0, -1));
    },
    onEnter: () => {
      onSubmit?.(value);
    },
    onEscape: () => {
      onCancel?.();
    },
  });

  const clear = useCallback(() => {
    setValue("");
    clearBuffer();
  }, [setValue, clearBuffer]);

  return {
    value,
    setValue,
    isStealthActive: isActive,
    isStealthSupported: isSupported,
    enableStealth: enable,
    disableStealth: disable,
    clear,
  };
};
