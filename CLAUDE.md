# Pluely – AI Assistant Guide

Pluely is an open-source, privacy-first AI assistant desktop application (GPL-3.0, v0.1.9) and an open-source alternative to Cluely. It runs as a translucent overlay window and supports real-time system audio capture, voice input, screenshot capture, file attachments, and multi-provider AI/STT integration — all stored locally with no external telemetry.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 7 |
| Styling | Tailwind CSS 4, Radix UI (shadcn/ui new-york) |
| Desktop | Tauri 2 (Rust backend, cross-platform) |
| Routing | React Router 7 |
| State | React Context API (no Redux/Zustand) |
| Database | SQLite via `tauri-plugin-sql` |
| Icons | Lucide React |

---

## Repository Structure

```
pluely/
├── src/                        # React/TypeScript frontend
│   ├── components/             # UI components
│   │   └── ui/                 # Radix UI primitives (shadcn/ui)
│   ├── pages/                  # Route-level components
│   │   ├── app/                # Main AI interaction interface
│   │   ├── dashboard/          # Usage stats & API setup
│   │   ├── chats/              # Conversation history browser
│   │   ├── system-prompts/     # Custom system prompt management
│   │   ├── settings/           # User preferences
│   │   ├── dev/                # Developer console (custom AI/STT providers)
│   │   ├── audio/              # Audio device selection
│   │   ├── screenshot/         # Screenshot settings
│   │   ├── shortcuts/          # Keyboard shortcut configuration
│   │   └── responses/          # Response formatting preferences
│   ├── hooks/                  # Custom React hooks (business logic)
│   ├── contexts/               # app.context.tsx + theme.context.tsx
│   ├── lib/
│   │   ├── database/           # SQLite CRUD operations
│   │   ├── storage/            # localStorage helpers
│   │   └── functions/          # AI completion, STT, Pluely API
│   ├── config/                 # Constants, built-in providers, shortcuts
│   ├── types/                  # TypeScript interfaces
│   ├── layouts/                # DashboardLayout, PageLayout, ErrorLayout
│   └── routes/                 # React Router route definitions
├── src-tauri/                  # Rust backend (Tauri 2)
│   └── src/
│       ├── lib.rs              # App init + all Tauri IPC command handlers
│       ├── main.rs             # Entry point
│       ├── window.rs           # Window management
│       ├── capture.rs          # Screenshot capture
│       ├── shortcuts.rs        # Global keyboard shortcuts
│       ├── activate.rs         # License activation
│       ├── api.rs              # External API calls & streaming
│       ├── speaker/            # Platform-specific audio (macos/linux/windows)
│       └── db/                 # SQLite migrations
├── .github/
│   ├── workflows/publish.yml   # CI/CD: builds & releases all platforms
│   └── ISSUE_TEMPLATE/         # Bug/feature/general issue templates
├── package.json
├── vite.config.ts
├── tsconfig.json
├── components.json             # shadcn/ui configuration
└── src-tauri/tauri.conf.json   # Tauri app & window configuration
```

---

## Development Commands

```bash
npm run dev              # Start Vite dev server (http://localhost:1420)
npm run build            # TypeScript compile + Vite build → dist/
npm run preview          # Preview production build locally
npm run tauri            # Tauri CLI passthrough
npm run tauri:build:x64  # Build macOS x86_64 binary
```

> There is no test runner configured. TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`) is the primary correctness check.

---

## Architecture

### Multi-Window Design

The main app window is a 600×54 translucent overlay (`tauri.conf.json`). Screenshot capture spawns separate overlay windows. All windows stay in sync via **localStorage events** — when one window writes a key, others react via `storage` event listeners.

### State Management

State is managed exclusively through React Context API:

- **`AppContext`** (`src/contexts/app.context.tsx`) — monolithic context holding AI/STT provider selection, system prompt, license state, audio device, screenshot settings, and app customization. Access via `useApp()`.
- **`ThemeContext`** (`src/contexts/theme.context.tsx`) — light/dark/system theme. Access via `useTheme()`.

Components should stay thin; put business logic in custom hooks.

### Hook Catalog (`src/hooks/`)

| Hook | Responsibility |
|------|---------------|
| `useCompletion` | AI completion state, conversation management |
| `useChatCompletion` | Chat-specific completion |
| `useHistory` | SQLite conversation CRUD, search, download |
| `useSystemAudio` | System audio capture management |
| `useGlobalShortcuts` | Tauri global shortcut registration |
| `useShortcuts` | Local shortcut management |
| `useSystemPrompts` | System prompt CRUD |
| `useCustomProvider` | Custom AI provider management |
| `useCustomSttProviders` | Custom STT provider management |
| `useSettings` | Persisted user settings |
| `useWindow` | Window resize/focus via Tauri IPC |
| `useApp` | Global `AppContext` accessor |

### CURL-Based Provider Model

AI and STT providers are defined as CURL templates with placeholder variables:

| Variable | Replaced with |
|----------|--------------|
| `{{API_KEY}}` | From Tauri keychain secure storage |
| `{{MODEL}}` | User-selected model |
| `{{SYSTEM_PROMPT}}` | Active system prompt |
| `{{TEXT}}` | User text input |
| `{{IMAGE}}` | Base64-encoded image (if provider supports it) |
| `{{AUDIO}}` | Base64-encoded audio (STT providers) |

Built-in providers live in `src/config/ai-providers.constants.ts` and `src/config/stt.constants.ts`. Users add custom providers via the `/dev-space` page. All provider logic flows through `src/lib/functions/ai-response.function.ts`.

### Tauri IPC Commands

Frontend calls Rust via `invoke()`. All commands are registered in `src-tauri/src/lib.rs`. Categories:

- **Window**: `open_dashboard`, `toggle_dashboard`, `set_window_height`, `move_window`
- **Capture**: `capture_to_base64`, `start_screen_capture`, `capture_selected_area`, `close_overlay_window`
- **Shortcuts**: `update_shortcuts`, `check_shortcuts_registered`, `validate_shortcut_key`
- **License**: `activate_license_api`, `deactivate_license_api`, `validate_license_api`, `set_license_status`
- **Secure storage**: `secure_storage_save`, `secure_storage_get`, `secure_storage_remove`
- **Audio**: `transcribe_audio`, `chat_stream_response`, audio stream commands
- **App**: `get_app_version`, `exit_app`, `set_app_icon_visibility`, `set_always_on_top`

---

## Data Layer

### SQLite (`sqlite:pluely.db`)

Two tables managed via Rust migrations in `src-tauri/src/db/`:

```sql
conversations (id, title, created_at, updated_at)
messages      (id, conversation_id, role, content, timestamp, attached_files JSON)
```

Frontend CRUD lives in `src/lib/database/chat-history.action.ts`. Always use the provided action functions — never write raw SQL in components.

### localStorage

All localStorage access goes through `safeLocalStorage` (wraps with error handling). Storage keys are centralized constants in `src/config/constants.ts` — never use raw string literals for keys.

### Tauri Keychain

Sensitive values (API keys, license key) are stored via `secure_storage_save`/`secure_storage_get` Tauri commands. Do not store sensitive values in localStorage.

---

## Code Conventions

### Naming

- **Components**: PascalCase, named exports — `export const MyComponent = () => {}`
- **Hooks**: camelCase with `use` prefix — `useMyFeature.ts`
- **Types/Interfaces**: PascalCase — `interface ChatMessage { ... }`
- **Files**: match the exported name (components: `MyComponent.tsx`, hooks: `useMyHook.ts`)

### Imports

- Always use the `@/` alias (maps to `src/`) — never relative paths from `src/`
- Each feature folder exposes a barrel `index.ts` — import from the folder, not the file

### Styling

- Tailwind CSS utility classes throughout
- Combine classes with the `cn()` helper from `@/lib/utils`
- Component variants use `class-variance-authority` (CVA) — see `src/components/ui/button.tsx` for the pattern

### No Linting Config

There is no ESLint or Prettier configuration. Follow the patterns already in the codebase: 2-space indentation, single quotes for strings, no semicolons are common but not enforced.

---

## Critical Files

| Purpose | Path |
|---------|------|
| Global app state | `src/contexts/app.context.tsx` |
| Route definitions | `src/routes/index.tsx` |
| AI completion logic | `src/lib/functions/ai-response.function.ts` |
| Database CRUD | `src/lib/database/chat-history.action.ts` |
| Storage key constants | `src/config/constants.ts` |
| Built-in AI providers | `src/config/ai-providers.constants.ts` |
| Built-in STT providers | `src/config/stt.constants.ts` |
| Tauri IPC handlers | `src-tauri/src/lib.rs` |
| Window & app config | `src-tauri/tauri.conf.json` |
| CI/CD pipeline | `.github/workflows/publish.yml` |

---

## Git & CI/CD

- **Default branch**: `master`; use feature branches → PR → merge
- **CI/CD**: GitHub Actions triggers on push to `master`, builds for macOS (arm64 + x86_64), Ubuntu 22.04, and Windows
- **Releases**: Published via `tauri-apps/tauri-action` as GitHub releases with native updater JSON
- **Version**: Must be kept in sync across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`

### Environment Variables (CI only)

These are injected from GitHub Actions secrets — there is no local `.env` file:

| Variable | Purpose |
|----------|---------|
| `API_ACCESS_KEY` | Backend API access |
| `PAYMENT_ENDPOINT` | Payment processing endpoint |
| `APP_ENDPOINT` | Application endpoint |
| `POSTHOG_API_KEY` | Analytics |

---

## Platform Notes

The Rust backend contains platform-specific code:

- **macOS**: NSPanel integration (`tauri-nspanel`), macOS permissions API, `speaker/macos.rs`
- **Linux**: ALSA/PulseAudio via `libpulse`, `speaker/linux.rs`
- **Windows**: WASAPI audio, `speaker/windows.rs`

Use `#[cfg(target_os = "...")]` for any new platform-specific Rust code.
