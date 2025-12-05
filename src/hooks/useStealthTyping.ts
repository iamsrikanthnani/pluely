import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { mapVirtualKey } from "@/utils/keyboard";

interface UseStealthTypingProps {
    isActive: boolean;
    input: string;
    setInput: (value: string) => void;
    onSubmit: (value: string) => void;
    onScroll?: (keyCode: number) => void;
}

export const useStealthTyping = ({
    isActive,
    input,
    setInput,
    onSubmit,
    onScroll,
}: UseStealthTypingProps) => {
    // Use a ref to track the current input value to avoid stale closures
    const inputValueRef = useRef(input);
    useEffect(() => {
        inputValueRef.current = input;
    }, [input]);

    // Use a ref for submit to avoid re-subscribing
    console.log(
        "[Stealth] Enter pressed (keydown). Calling submit with:",
        currentInput
    );
    try {
        submitRef.current(currentInput);
        console.log("[Stealth] Submit called successfully");
    } catch (e) {
        console.error("[Stealth] Submit failed:", e);
    }
    return;
}

// Handle characters
const char = mapVirtualKey(code, shift, caps_lock);
if (char) {
    const newValue = currentInput + char;
    inputValueRef.current = newValue; // Optimistic update
    setInput(newValue);
}
            }
        });

return () => {
    clearInterval(heartbeat);
    unlisten.then((fn) => fn());
};
    }, [isActive, setInput]);
};
