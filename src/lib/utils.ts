import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const floatArrayToWav = (
  audioData: Float32Array,
  sampleRate: number = 16000,
  format: "wav" | "mp3" | "ogg" = "wav"
): Blob => {
  const buffer = new ArrayBuffer(44 + audioData.length * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  const dataSize =
    format === "wav" ? 36 + audioData.length * 2 : 44 + audioData.length * 2;
  view.setUint32(4, dataSize, true);
  writeString(8, format === "wav" ? "WAVE" : "FORM");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, audioData.length * 2, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: `audio/${format}` });
};

export interface FillerClassifierOptions {
  minScore?: number;
  treatContinueAsFiller?: boolean;
}

export interface FillerClassificationResult {
  isFiller: boolean;
  score: number;
  reasons: string[];
  normalized: string;
  tokens: string[];
}

const COMMAND_TOKENS = new Set([
  "open",
  "search",
  "summarize",
  "send",
  "stop",
  "pause",
  "resume",
  "cancel",
  "undo",
  "redo",
  "new",
  "save",
  "delete",
  "start",
  "end",
  "record",
  "listen",
  "copy",
  "paste",
  "translate",
]);

const NON_FILLER_SHORT = new Set(["yes", "no", "yep", "nope", "yeah"]);

const FILLER_TOKENS = new Set([
  "mm",
  "mmm",
  "hmm",
  "hm",
  "uh",
  "uhhuh",
  "um",
  "er",
  "ah",
  "ok",
  "okay",
  "k",
  "continue",
  "go",
  "on",
  "right",
  "sure",
  "alright",
  "all",
]);

const FILLER_PHRASES = new Set([
  "mm",
  "mmm",
  "mm hmm",
  "hmm",
  "hm",
  "uh",
  "uh huh",
  "uhhuh",
  "um",
  "er",
  "ah",
  "ok",
  "okay",
  "k",
  "continue",
  "go on",
  "right",
  "sure",
  "alright",
  "all right",
]);

const normalizeTranscription = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (input: string) => input.split(" ").filter(Boolean);

export const classifyFillerTranscription = (
  input: string,
  options: FillerClassifierOptions = {}
): FillerClassificationResult => {
  const minScore = options.minScore ?? 3;
  const normalized = normalizeTranscription(input);
  const tokens = tokenize(normalized);
  const reasons: string[] = [];
  let score = 0;

  if (!normalized) {
    return { isFiller: false, score, reasons, normalized, tokens };
  }

  if (tokens.some((token) => COMMAND_TOKENS.has(token))) {
    return {
      isFiller: false,
      score,
      reasons: ["contains-command-token"],
      normalized,
      tokens,
    };
  }

  if (tokens.some((token) => NON_FILLER_SHORT.has(token))) {
    return {
      isFiller: false,
      score,
      reasons: ["contains-non-filler-ack"],
      normalized,
      tokens,
    };
  }

  if (!options.treatContinueAsFiller) {
    if (tokens.includes("continue")) {
      return {
        isFiller: false,
        score,
        reasons: ["continue-treated-as-command"],
        normalized,
        tokens,
      };
    }
  }

  if (FILLER_PHRASES.has(normalized)) {
    score += 3;
    reasons.push("exact-filler-phrase");
  }

  if (tokens.length <= 2) {
    score += 1;
    reasons.push("short-utterance");
  }

  if (tokens.length > 0 && tokens.every((token) => FILLER_TOKENS.has(token))) {
    score += 2;
    reasons.push("all-filler-tokens");
  }

  if (normalized.length <= 6) {
    score += 1;
    reasons.push("very-short-text");
  }

  if (tokens.some((token) => /^(m+|h+|um+|uh+)$/.test(token))) {
    score += 1;
    reasons.push("phonetic-repetition");
  }

  const uniqueTokens = new Set(tokens);
  if (tokens.length > 0 && uniqueTokens.size / tokens.length <= 0.5) {
    score += 1;
    reasons.push("low-token-variety");
  }

  return { isFiller: score >= minScore, score, reasons, normalized, tokens };
};

export const isFillerTranscription = (input: string): boolean => {
  return classifyFillerTranscription(input, { treatContinueAsFiller: true })
    .isFiller;
};