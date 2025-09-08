# 🔊 System Audio Capture Setup Guide

This guide helps you set up system audio capture for real-time transcription. Pluely captures your computer's audio output and automatically transcribes speech from videos, meetings, music, and any audio playing on your system.

## 🎯 What This Enables

System audio capture allows Pluely to transcribe:

- 🎥 **Meeting audio** (Zoom, Teams, Google Meet, Discord)
- 🎬 **Video content** (YouTube, Netflix, Twitch)
- 🎵 **Music and podcasts** (Spotify, Apple Music)
- 🎮 **Game audio and commentary**
- 📞 **VoIP calls** (Skype, WhatsApp)
- 📱 **Any audio playing on your computer**

## 🔒 Why Setup is Required

Your operating system doesn't allow applications to directly capture "system audio" for security and privacy reasons. Virtual audio devices create a secure bridge that routes your system audio to Pluely.

**This is the industry standard** - OBS Studio, Discord screen sharing, Zoom computer audio, and all professional audio apps require similar setup.

---

## 🍎 macOS Setup

### Install BlackHole (Recommended)

**Option 1: Homebrew (Easiest)**

```bash
brew install blackhole-2ch
```

**Option 2: Manual Download**

- Visit: https://existential.audio/blackhole/
- Download "BlackHole 2ch" and install the .pkg file
- Restart your computer

### Configure Audio Routing

**What is Audio MIDI Setup?** A built-in macOS utility for managing audio devices and routing.

**Step-by-step setup:**

1. **Open Audio MIDI Setup**:

   - Press `Cmd + Space` → type "Audio MIDI Setup" → press Enter
   - OR: **Applications** → **Utilities** → **Audio MIDI Setup**

2. **Create Multi-Output Device**:

   - Click the **"+"** button (bottom left corner)
   - Select **"Create Multi-Output Device"**

3. **Configure the Multi-Output Device**:

   - **Name it**: "Speakers + BlackHole" (or any name you prefer)
   - **Check both boxes**:
     - ✅ Your speakers/headphones (e.g., "MacBook Pro Speakers", "AirPods")
     - ✅ **"BlackHole 2ch"** (should appear after installation)

4. **Set Master Device**:

   - Click the dropdown next to your speakers
   - Select **"Master Device"** (this controls volume)

5. **Activate the Setup**:
   - Right-click on "Speakers + BlackHole" device
   - Select **"Use This Device For Sound Output"**

**✅ Verification**: You should now hear audio through your speakers AND Pluely can capture it.

### Grant Permissions

- **Microphone Access**: System Preferences → Security & Privacy → Privacy → Microphone → Check "Pluely"
- **Screen Recording Access**: System Preferences → Security & Privacy → Privacy → Screen Recording → Check "Pluely"

---

## 🪟 Windows Setup

### Option 1: Enable Stereo Mix (Built-in)

**What is Stereo Mix?** A built-in Windows feature that captures "what you hear" - perfect for system audio capture.

**Step-by-step setup:**

1. **Open Sound Settings**:

   - Right-click the **speaker icon** in system tray (bottom right)
   - Select **"Sounds"**

2. **Access Recording Devices**:

   - Go to **"Recording"** tab
   - Right-click in empty space
   - Check **"Show Disabled Devices"** and **"Show Disconnected Devices"**

3. **Enable Stereo Mix**:
   - Look for **"Stereo Mix"** in the list
   - Right-click **"Stereo Mix"** → **"Enable"**
   - Right-click **"Stereo Mix"** → **"Set as Default Device"**

**✅ Verification**: Play some audio - you should see the Stereo Mix level bar moving.

### Option 2: VB-Audio Virtual Cable (If Stereo Mix unavailable)

**What is VB-Audio Virtual Cable?** A free virtual audio driver that creates virtual input/output devices.

**Step-by-step setup:**

1. **Download and Install**:

   - Visit: https://vb-audio.com/Cable/
   - Download **"VB-CABLE Virtual Audio Device"**
   - **Important**: Right-click installer → **"Run as Administrator"**
   - Follow installation wizard
   - **Restart computer** (required)

2. **Configure Audio Routing**:

   - Right-click speaker icon → **"Sounds"** → **"Playback"** tab
   - Right-click **"CABLE Input"** → **"Set as Default Device"**
   - Now your system audio goes to the virtual cable

3. **Optional - Hear Audio Too**:
   - Go to **"Recording"** tab
   - Right-click **"CABLE Output"** → **"Properties"**
   - **"Listen"** tab → Check **"Listen to this device"**
   - Select your speakers from dropdown

**✅ Verification**: You should see "CABLE Output" as an available input device in Pluely.

---

## 🐧 Linux Setup

### PulseAudio Monitor (Most Common)

**What are Monitor Devices?** Built-in virtual inputs that capture what's playing through your speakers - Linux's transparent approach to system audio capture.

**Step-by-step setup:**

1. **Check for Existing Monitor Devices**:

   ```bash
   # List all audio sources
   pactl list sources short

   # Look for devices ending with ".monitor"
   pactl list sources short | grep monitor
   ```

2. **If Monitor Devices Found**:

   - Great! They should work automatically with Pluely
   - Skip to testing section below

3. **If No Monitor Devices Found**:

   ```bash
   # Install PulseAudio utilities (Ubuntu/Debian)
   sudo apt install pulseaudio-utils

   # For Fedora/CentOS
   sudo dnf install pulseaudio-utils

   # For Arch Linux
   sudo pacman -S pulseaudio
   ```

4. **Create Loopback Module** (if still no monitors):

   ```bash
   # Create temporary loopback
   pactl load-module module-loopback latency_msec=1

   # Make it permanent
   echo "load-module module-loopback latency_msec=1" >> ~/.config/pulse/default.pa

   # Restart PulseAudio
   pulseaudio -k && pulseaudio --start
   ```

**✅ Verification**: Run `pactl list sources short | grep monitor` - you should see monitor devices listed.

---

## 🧪 Testing Your Setup

### Step-by-Step Testing

1. **Open Pluely Application**

2. **Access System Audio**:

   - Click the **system audio button** (headphones icon in Pluely)
   - The button should be visible in the main interface

3. **Start System Audio Capture**:

   - Click **"🔄 System Audio"** button
   - Pluely will attempt to detect your virtual audio device

4. **Test Audio Playback**:

   - Play some **music, video, or speech** on your computer
   - Use YouTube, Spotify, or any audio source

5. **Verify Capture**:
   - You should see **audio activity** in Pluely
   - Look for **transcription text** appearing
   - Check that the **audio visualizer** shows movement

### Debug Tools (If Issues)

- **"🔍 Debug Devices"** - Lists all available audio input devices
- **"🎵 Test Audio"** - Tests audio levels for 3 seconds and shows RMS values
- **Console Output** - Check for messages like "Selected virtual audio device: [Device Name]"

### Expected Results

**✅ Working Correctly:**

- You see audio activity and waveforms
- Transcription text appears when speech is detected
- Console shows: "Selected virtual audio device: BlackHole 2ch" (or similar)

**❌ Not Working:**

- No audio activity detected
- RMS values remain at 0.000000
- No transcription appears
- Error messages about device detection

### What Each Platform Should Show

| Platform    | Expected Device Detection                 |
| ----------- | ----------------------------------------- |
| **macOS**   | "BlackHole 2ch" or "Speakers + BlackHole" |
| **Windows** | "Stereo Mix" or "CABLE Output"            |
| **Linux**   | Device ending with ".monitor"             |

---

## 🔧 Quick Troubleshooting

| Platform    | Issue                    | Solution                                      |
| ----------- | ------------------------ | --------------------------------------------- |
| **macOS**   | BlackHole not detected   | Check System Preferences → Sound → Output     |
| **macOS**   | No audio levels          | Recreate Multi-Output Device                  |
| **Windows** | Stereo Mix not available | Update audio drivers or use VB-Cable          |
| **Windows** | VB-Cable not working     | Run installer as Administrator, restart       |
| **Linux**   | No monitor devices       | Install pulseaudio-utils, create loopback     |
| **All**     | Permission errors        | Grant microphone/screen recording permissions |

---

## 🎯 Platform Summary

| Platform    | Recommended Method       | Difficulty |
| ----------- | ------------------------ | ---------- |
| **macOS**   | BlackHole + Multi-Output | Medium     |
| **Windows** | Stereo Mix or VB-Cable   | Easy       |
| **Linux**   | PulseAudio Monitor       | Easy       |

---

## 🆘 Need Help?

1. Use Pluely's built-in **"🔍 Debug"** and **"🎵 Test Audio"** tools
2. Check console output for specific error messages
3. Ensure all required permissions are granted
4. Try **"🎤 Use Microphone"** as fallback if system audio setup fails

**Remember:** This setup is required for all system audio capture applications - it's not specific to Pluely but a universal requirement for security reasons.
