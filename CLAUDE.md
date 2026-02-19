# Pluely

Privacy-first AI desktop assistant built with Tauri v2. Captures system audio + microphone for real-time AI conversations during meetings, interviews, etc.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Rust (Tauri v2)
- **Audio**: WASAPI (Windows), CoreAudio (macOS), PipeWire (Linux)
- **Platform**: Windows (WebView2), macOS (WebKit), Linux (WebKitGTK)

## Project Structure

```
src/                          # React frontend
  components/                 # shadcn/ui components
  config/                     # Constants, storage keys
  contexts/                   # React contexts (app state, theme)
  hooks/                      # Custom hooks (useSystemPrompts, etc.)
  lib/functions/              # Core logic (ai-response, stt, tts)
  pages/                      # Pages (chats, system-prompts, settings)
  types/                      # TypeScript types

src-tauri/src/                # Rust backend
  speaker/                    # Audio capture (WASAPI/CoreAudio/PipeWire)
    windows.rs                # Windows: SpeakerRecorder + MicrophoneRecorder
    commands.rs               # Tauri commands for audio recording
  db/                         # SQLite database
  api.rs                      # Pluely API client
  capture.rs                  # Screenshot capture
  lib.rs                      # Tauri app setup + command registration
```

## Commands

```bash
npm run tauri dev             # Dev server (frontend + Rust backend)
npx tsc --noEmit              # TypeScript type check
npm run build                 # Vite production build (frontend only)
npm run tauri build           # Full production build
```

### Windows dev (requires VS Build Tools)

```powershell
# Load VS Developer Environment first, then:
npm run tauri dev
# Or use the helper script:
.\run_dev.ps1
```

## Key Patterns

- **Storage**: Use `safeLocalStorage` wrapper + `STORAGE_KEYS` from `src/config/constants.ts`
- **AI providers**: Configured via curl-based custom providers in settings
- **System prompts**: User-created (SQLite) + Pluely defaults (backend API), mutually exclusive selection
- **Audio**: Rust captures audio → returns base64 WAV → frontend sends to STT API
- **STT**: Audio resampled to 16kHz before sending to Whisper (Groq)
- **License**: `hasActiveLicense` in `src/contexts/app.context.tsx` (hardcoded to `true`)

## Notes

- WebView2 `getUserMedia()` is broken on Windows (Issue #1462) — microphone uses Rust WASAPI instead
- Whisper works best with 16kHz mono audio — always resample before sending
- Frontend invokes Rust commands via `@tauri-apps/api/core` `invoke()`
