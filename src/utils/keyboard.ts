/**
 * Maps a virtual key code to a character based on modifier states.
 * @param code The virtual key code
 * @param shift Whether the Shift key is pressed
 * @param capsLock Whether Caps Lock is active
 * @returns The mapped character or null if no mapping exists
 */
export const mapVirtualKey = (
    code: number,
    shift: boolean,
    capsLock: boolean
): string | null => {
    // Space
    if (code === 32) {
        return " ";
    }

    // A-Z
    if (code >= 65 && code <= 90) {
        let char = String.fromCharCode(code);
        // Logic: If Shift == CapsLock, then lowercase.
        // Shift(0) ^ Caps(0) = 0 -> Lowercase (Wait, standard logic is: if Shift != Caps, then Uppercase)
        // Let's trace:
        // Shift(0), Caps(0) -> Lowercase
        // Shift(1), Caps(0) -> Uppercase
        // Shift(0), Caps(1) -> Uppercase
        // Shift(1), Caps(1) -> Lowercase
        // So if Shift === Caps, it's Lowercase.
        if (shift === (capsLock || false)) {
            char = char.toLowerCase();
        }
        return char;
    }

    // 0-9
    if (code >= 48 && code <= 57) {
        let char = String.fromCharCode(code);
        // Handle Shift+Number for special characters (US Layout)
        if (shift) {
            const specialChars = [")", "!", "@", "#", "$", "%", "^", "&", "*", "("];
            char = specialChars[code - 48];
        }
        return char;
    }

    // Punctuation
    if (code >= 186 && code <= 222) {
        const map: Record<number, string> = {
            186: ";",
            187: "=",
            188: ",",
            189: "-",
            190: ".",
            191: "/",
            192: "`",
            219: "[",
            220: "\\",
            221: "]",
            222: "'",
        };
        const shiftMap: Record<number, string> = {
            186: ":",
            187: "+",
            188: "<",
            189: "_",
            190: ">",
            191: "?",
            192: "~",
            219: "{",
            220: "|",
            221: "}",
            222: '"',
        };
        if (map[code]) {
            return shift ? shiftMap[code] : map[code];
        }
    }

    return null;
};
