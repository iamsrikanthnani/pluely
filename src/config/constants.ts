// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: "settings",
  CHAT_HISTORY: "chat_history",
  CUSTOM_PROVIDERS: "custom_providers",
  SPEECH_PROVIDERS: "speech_providers",
  SELECTED_SPEECH_PROVIDER: "selected_speech_provider",

  // new keys
  THEME: "theme",
  SYSTEM_PROMPT: "system_prompt",
  SCREENSHOT_CONFIG: "screenshot_config",
  CUSTOM_AI_PROVIDERS: "custom_ai_providers",
  CUSTOM_SPEECH_PROVIDERS: "custom_speech_providers",
  SELECTED_AI_PROVIDER: "selected_ai_provider",
  SELECTED_STT_PROVIDER: "selected_stt_provider",
} as const;

// Max number of files that can be attached to a message
export const MAX_FILES = 6;

// Default settings
export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Be concise, accurate, and friendly in your responses";
