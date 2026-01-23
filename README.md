# Nluely

Nluely is a privacy-first desktop AI assistant built with Tauri + React. It runs locally and connects directly from your device to the AI provider(s) you configure (OpenAI/Groq/Gemini/Claude and any OpenAI-compatible endpoint).

## Features

- Always-on-top translucent overlay
- Chats with file and image attachments (provider-dependent)
- Screenshot capture (full screen or selection)
- Voice input and speech-to-text (via configurable STT providers)
- System prompts, response settings, and global shortcuts

## Development

```bash
npm ci
npm run tauri dev
```

## Build

```bash
npm run build
npm run tauri build
```

## License

GPL-3.0
