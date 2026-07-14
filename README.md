# Pluely v1 🚀

_One overlay, no tab, no trace._

<a href="https://pluely.com/">
  <img src="/images/pluely-v1-listen.png" alt="The Pluely v1 overlay in Listen mode: live transcript, prompt tabs, and the answer panel, floating over the desktop" width="100%" />
</a>

<p align="center"><i>The actual overlay in Listen mode, floating over the desktop. Invisible on screen shares.</i></p>

---

[![Website](https://img.shields.io/badge/Website-pluely.com-blue)](https://pluely.com/)
[![Docs](https://img.shields.io/badge/Docs-docs.pluely.com-blue)](https://docs.pluely.com)
[![Tauri](https://img.shields.io/badge/Built%20with-Tauri-orange)](https://tauri.app/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)](https://reactjs.org/)
[![Source](<https://img.shields.io/badge/Source-Closed%20(v1%2B)-lightgrey>)](#why-pluely-v1-is-closed-source)

### 💝 **Socials**

[![GitHub](https://img.shields.io/badge/GitHub-iamsrikanthnani-black?style=flat&logo=github)](https://github.com/iamsrikanthnani)
[![X](https://img.shields.io/badge/@srikanthnani-1DA1F2?style=flat&logo=X)](https://x.com/srikanthnani)
[![Website](https://img.shields.io/badge/Website-srikanthnani.com-blue?style=flat&logo=globe)](https://www.srikanthnani.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-iamsrikanthnani-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/iamsrikanthnani/)

> **Your invisible AI, over everything you do.** Ask about anything on your screen. Listen to any conversation and have the right answer before you need it. One overlay, no tab, no trace. Invisible on screen shares, and no bot ever joins your calls.

📖 Every feature is documented at **[docs.pluely.com](https://docs.pluely.com)**, from the [5-minute quickstart](https://docs.pluely.com/docs/getting-started/quickstart) to [live transcription](https://docs.pluely.com/docs/features/listen-mode), [automatic responses](https://docs.pluely.com/docs/features/auto-responses), and [every keyboard shortcut](https://docs.pluely.com/docs/guides/overlay-shortcuts).

### 🔒 Why is Pluely closed source now?

Years of open Pluely code kept getting repackaged and sold as clones, and no license or complaint ever stopped it.
So v1 ships as signed binaries while the product itself stays free to use at its core.
The short story is [further down this page](#why-pluely-v1-is-closed-source), and everything else lives at [pluely.com](https://pluely.com).

---

## 📥 **Download Pluely**

<div align="center">

### 🚀 **Get the Latest Release**

[![Download for macOS](https://img.shields.io/badge/Download%20for-macOS-000000?style=for-the-badge&logo=apple&logoColor=white)](https://pluely.com/download/macos) &nbsp; [![Download for Linux](https://img.shields.io/badge/Download%20for-Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://pluely.com/download/linux) &nbsp; [![Download for Windows](https://img.shields.io/badge/Download%20for-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://pluely.com/download/windows)

[![GitHub Release](https://img.shields.io/github/v/release/iamsrikanthnani/pluely?style=for-the-badge&logo=github&label=Latest%20Version)](https://pluely.com/releases) &nbsp; [![GitHub Downloads](https://img.shields.io/github/downloads/iamsrikanthnani/pluely/total?style=for-the-badge&logo=github&label=Total%20Downloads)](https://pluely.com/downloads)

**Available formats:** `.dmg` (macOS) • `.msi` / `.exe` (Windows) • `.deb` / `.rpm` / `.AppImage` (Linux)

**Free plan forever** · no account needed to start · updates ship automatically

</div>

---

## ✨ What is Pluely v1?

Pluely v1 is a ground-up rebuild: one translucent overlay with two modes, **Ask** and **Listen**, plus a full dashboard for your chats, meetings, files, prompts, and settings. It's built for the moments where switching to a browser tab would cost you the room: interviews, sales calls, standups, lectures, live debugging.

|         🪶 **Lightweight**          |             🕶️ **Invisible**             |                ⚡ **Instant**                |
| :---------------------------------: | :--------------------------------------: | :------------------------------------------: |
|      **9 to 16 MB** installer       | Hidden from screen shares and recordings |  Launches in under 100ms, answers in a tap   |
| A fraction of Electron alternatives | No meeting bot, no participant, no trace | Global hotkeys summon it from inside any app |
|   Minimal CPU and RAM, even live    |  Can hide from the Dock and taskbar too  |    Streaming answers, live transcription     |

## 💬 Ask mode

<img src="/images/pluely-v1-ask.gif" alt="Ask mode: attach a screenshot of an error, ask what's breaking, get a streamed answer with follow-up suggestions" width="100%" />

Type a question, dictate it with push-to-talk, or let Pluely see your screen: capture it, drag-select a region, attach files, or turn on **Use image** so every message carries a fresh screenshot. Documents go through built-in OCR and stay in context for follow-up questions. Answers stream in as Markdown, and everything is saved locally where you can search, export, or delete it.

## 🎧 Listen mode

<img src="/images/pluely-v1-listen.gif" alt="Listen mode: live transcript of a sales call, an automatic suggested answer, and one-tap follow-up chips" width="100%" />

Hit Start and Pluely transcribes your mic and system audio live, with speaker labels and language selection. Automatic responses fire when someone asks a question, after every pause, or only when you tap Suggest. Smart follow-up chips appear under each answer, generated from the actual conversation. Every session is saved as a meeting with its full transcript.

## 🧰 What else is in the box

- **200+ hosted models** on Pro plans: GPT, Gemini, Claude, Llama and more, searchable and switchable mid-conversation, no API keys to manage.
- **Free forever with your own keys**: connect any LLM or speech-to-text provider through a curl template, or plug in the AI CLIs you already have (Claude Code, Gemini CLI, Codex, Qwen Code, Ollama). No limits from us; it's your account.
- **Real stealth**: excluded from screen capture, absent from recordings and screenshots, never steals focus from the app you're in, and the [icon can disappear from the Dock or taskbar](https://docs.pluely.com/docs/settings/app-icon-stealth). Details in [Stealth & privacy](https://docs.pluely.com/docs/features/stealth-privacy).
- **Keyboard-first**: global hotkeys for summon, capture, and listening; single keys scroll the answer and transcript once the overlay has focus. Full reference: [Overlay shortcuts](https://docs.pluely.com/docs/guides/overlay-shortcuts).
- **Private by architecture**: chats, meetings, transcripts, and files live in a local SQLite database on your machine. Your own provider keys stay local. Your conversations never train anything.
- **Custom prompts with knowledge files**, a document library, plan and usage meters, and identical builds for macOS, Windows, and Linux.

The full tour with visuals is at **[pluely.com/features](https://pluely.com/features)**, and pricing is at **[pluely.com/pricing](https://pluely.com/pricing)**.

## 📚 Documentation

[docs.pluely.com](https://docs.pluely.com) covers every feature, setting, and edge case, with per-OS guides where platforms differ:

|                                       Start here                                        |                                  Features                                   |                                            Help                                             |
| :-------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: |
|          [Quickstart](https://docs.pluely.com/docs/getting-started/quickstart)          |      [Listen mode](https://docs.pluely.com/docs/features/listen-mode)       |                   [FAQ](https://docs.pluely.com/docs/troubleshooting/faq)                   |
|   [macOS permissions](https://docs.pluely.com/docs/getting-started/permissions-macos)   |   [Auto responses](https://docs.pluely.com/docs/features/auto-responses)    | [Shortcuts not working](https://docs.pluely.com/docs/troubleshooting/shortcuts-not-working) |
| [Windows permissions](https://docs.pluely.com/docs/getting-started/permissions-windows) | [Stealth & privacy](https://docs.pluely.com/docs/features/stealth-privacy)  |            [Connect a CLI](https://docs.pluely.com/docs/settings/connect-a-cli)             |
|   [Linux permissions](https://docs.pluely.com/docs/getting-started/permissions-linux)   | [Keyboard shortcuts](https://docs.pluely.com/docs/guides/overlay-shortcuts) |                     [Supported models](https://docs.pluely.com/models)                      |

---

## Why Pluely v1 is closed source

Pluely started fully open, first under MIT and later under GPL-3. The code was lifted and sold as rebranded commercial products almost from day one, and moving to GPL-3 changed nothing: the clones ignored the license entirely. I filed complaints and takedown requests and nothing came down. Chasing license violators across countries costs more time and money than one developer has, and even code I shared privately in good faith ended up misused.

So from v1, a complete rewrite, Pluely ships as signed binaries only. The old GPL-3 code stays available under its license in this repo's history. Please don't ask for source access; the answer will be a polite no until I decide otherwise.

What doesn't change: the free plan stays free, releases ship right here, [issues](https://github.com/iamsrikanthnani/pluely/issues) stay open for bug reports, and your data stays on your device.

---

## 📋 Prerequisites

Pluely installs like any normal desktop app. On Linux you need the WebKitGTK runtime that Tauri apps use, see [Tauri's prerequisites page](https://v2.tauri.app/start/prerequisites/) for your distro. macOS and Windows need nothing extra: grant the [screen and microphone permissions](https://docs.pluely.com/docs/getting-started/permissions-macos) on first run and you're set.

---

## 🐛 Feedback & bug reports

Found a bug or have an idea? Open a [GitHub issue](https://github.com/iamsrikanthnani/pluely/issues) or use [pluely.com/feedback](https://pluely.com/feedback). Real reports get fixed fast. For account or license help: [support@pluely.com](mailto:support@pluely.com).

> 💡 **Like this project?** Consider [buying me a coffee ☕](https://www.buymeacoffee.com/srikanthnani)

---

## 📄 License

Pluely v1 and later are proprietary, closed-source software distributed as binaries. See [Why Pluely v1 is closed source](#why-pluely-v1-is-closed-source). Versions that were published under the GPL-3 remain available under that license in this repository's history.

---

## 🙏 Acknowledgments

- **[Tauri](https://tauri.app/)** - Amazing desktop framework
- **[tauri-nspanel](https://github.com/ahkohd/tauri-nspanel)** - macOS native panel integration for Tauri
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components

---

## 🔗 Links

- **Website**: [pluely.com](https://pluely.com/)
- **Documentation**: [docs.pluely.com](https://docs.pluely.com)
- **Models**: [pluely.com/models](https://pluely.com/models)
- **Pricing**: [pluely.com/pricing](https://pluely.com/pricing)
- **Releases**: [pluely.com/releases](https://pluely.com/releases)
- **Issues**: [GitHub Issues](https://github.com/iamsrikanthnani/pluely/issues)
- **Discussions**: [GitHub Discussions](https://github.com/iamsrikanthnani/pluely/discussions)

---

### 🌐 **Let's Connect**

[![X](https://img.shields.io/badge/@srikanthnani-black?style=for-the-badge&logo=X)](https://x.com/srikanthnani)&nbsp;
[![Website](https://img.shields.io/badge/Website-srikanthnani.com-black?style=for-the-badge&logo=globe)](https://www.srikanthnani.com/)&nbsp;
[![LinkedIn](https://img.shields.io/badge/LinkedIn-iamsrikanthnani-black?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/iamsrikanthnani/)
[![GitHub](https://img.shields.io/badge/GitHub-iamsrikanthnani-black?style=for-the-badge&logo=github)](https://github.com/iamsrikanthnani)&nbsp;

---

**Made with ❤️ by [Srikanth Nani](https://www.srikanthnani.com/)**
