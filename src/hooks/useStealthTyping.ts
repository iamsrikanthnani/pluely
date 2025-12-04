import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { mapVirtualKey } from "@/utils/keyboard";

interface UseStealthTypingProps {
    isActive: boolean;
    input: string;
    setInput: (value: string) => void;
    onSubmit: (value: string) => void;
}

export const useStealthTyping = ({
    isActive,
    input,
    setInput,
    onSubmit,
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

        // Heartbeat log
        const heartbeat = setInterval(() => {
            console.log("[Stealth] Input component heartbeat - Listener active");
        }, 5000);

        const unlisten = listen("stealth-key-event", async (event: any) => {
            const { code, event_type, caps_lock, shift, ctrl } = event.payload;
            console.log(
                `[Stealth] Event: ${event_type}, Code: ${code}, Caps: ${caps_lock}, Shift: ${shift}, Ctrl: ${ctrl}`
            );
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

                // Handle Enter
                if (code === 13) {
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
