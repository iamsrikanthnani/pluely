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
    const submitRef = useRef(onSubmit);
    useEffect(() => {
        submitRef.current = onSubmit;
    }, [onSubmit]);

    useEffect(() => {
        if (!isActive) return;

        const unlisten = listen("stealth-key-event", async (event: any) => {
            const { code, event_type, caps_lock, shift } = event.payload;

            const isKeyDown = event_type === "keydown";
            const isKeyUp = event_type === "keyup";

            let currentInput = inputValueRef.current;

            // EXPERIMENTAL: Allow keyup to type characters.
            if (!isKeyDown && !isKeyUp) return;

            // Using keydown for responsiveness
            if (isKeyDown) {
                // Handle backspace
                if (code === 8) {
                    const newValue = currentInput.slice(0, -1);
                    inputValueRef.current = newValue; // Optimistic update
                    setInput(newValue);
                    return;
                }

                // Handle Navigation Keys (Arrows, PageUp/Down, Home, End)
                // 33: PageUp, 34: PageDown, 35: End, 36: Home
                // 37: Left, 38: Up, 39: Right, 40: Down
                if (code >= 33 && code <= 40) {
                    if (onScroll) {
                        onScroll(code);
                    }
                    return;
                }

                // Handle Enter
                if (code === 13) {
                    try {
                        submitRef.current(currentInput);
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
            unlisten.then((fn) => fn());
        };
    }, [isActive, setInput]);
};
