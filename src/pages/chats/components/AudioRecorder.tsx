import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components";
import { shouldUsePluelyAPI, fetchSTT } from "@/lib";
import { useApp } from "@/contexts";
import { StopCircle, Send } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onCancel: () => void;
}

const MAX_DURATION = 3 * 60 * 1000;

// Detect Windows platform for Rust-based recording
const isWindows =
  navigator.platform?.toLowerCase().includes("win") ||
  navigator.userAgent?.toLowerCase().includes("windows");

export const AudioRecorder = ({
  onTranscriptionComplete,
  onCancel,
}: AudioRecorderProps) => {
  const { selectedSttProvider, allSttProviders, selectedAudioDevices } =
    useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);

  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCleanedUpRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    isCleanedUpRef.current = false;
    startRecording();

    return () => {
      cleanup();
      // On unmount, try to stop any ongoing Rust recording to release the mic
      if (isWindows) {
        invoke("stop_microphone_recording").catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log("[AudioRecorder] Starting recording, isWindows:", isWindows);
      console.log(
        "[AudioRecorder] Selected device:",
        selectedAudioDevices?.input
      );

      if (isWindows) {
        // Use Rust WASAPI recording (bypasses WebView2 getUserMedia bug)
        const deviceId = selectedAudioDevices?.input?.id || undefined;
        console.log(
          "[AudioRecorder] Using Rust WASAPI, deviceId:",
          deviceId
        );

        await invoke("start_microphone_recording", {
          deviceId,
        });

        console.log("[AudioRecorder] Rust recording started successfully");
      }
      // On macOS/Linux, browser getUserMedia works fine — but this component
      // currently only needs to work on Windows. If needed, add browser fallback here.

      setIsRecording(true);
      startTimeRef.current = Date.now();

      durationIntervalRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current);
      }, 100);

      maxDurationTimeoutRef.current = setTimeout(() => {
        handleSend();
      }, MAX_DURATION);
    } catch (error) {
      console.error("[AudioRecorder] Failed to start recording:", error);
      cleanup();
      onCancel();
    }
  };

  const handleStop = async () => {
    cleanup();
    // Stop the Rust recording without using the audio
    if (isWindows) {
      try {
        await invoke("stop_microphone_recording");
      } catch (e) {
        // Ignore — may not be recording
      }
    }
    onCancel();
  };

  const handleSend = async () => {
    if (isTranscribing) return;

    setIsTranscribing(true);
    cleanup();

    try {
      let audioBlob: Blob;

      if (isWindows) {
        // Stop Rust recording and get base64 WAV
        console.log("[AudioRecorder] Stopping Rust recording...");
        const wavBase64 = await invoke<string>("stop_microphone_recording");
        console.log(
          "[AudioRecorder] Got WAV base64, length:",
          wavBase64.length
        );

        // Convert base64 to Blob
        const binaryString = atob(wavBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBlob = new Blob([bytes], { type: "audio/wav" });
      } else {
        // Fallback for non-Windows (shouldn't normally reach here)
        console.error(
          "[AudioRecorder] Non-Windows platform, no audio available"
        );
        onCancel();
        return;
      }

      console.log("[AudioRecorder] Audio blob size:", audioBlob.size);

      const usePluelyAPI = await shouldUsePluelyAPI();
      const provider = allSttProviders.find(
        (p) => p.id === selectedSttProvider.provider
      );
      console.log(
        "[AudioRecorder] STT provider:",
        provider?.id,
        "usePluely:",
        usePluelyAPI
      );

      const text = await fetchSTT({
        provider: usePluelyAPI ? undefined : provider,
        selectedProvider: selectedSttProvider,
        audio: audioBlob,
      });

      console.log("[AudioRecorder] Transcription result:", text);
      onTranscriptionComplete(text);
    } catch (error) {
      console.error("[AudioRecorder] Transcription failed:", error);
      onCancel();
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border bg-background rounded-lg overflow-hidden">
      <div className="h-12 relative bg-muted/20">
        {isRecording ? (
          <div className="h-full flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${12 + Math.random() * 16}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-2">
              Recording...
            </span>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            {isTranscribing ? "Transcribing..." : "Initializing..."}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono tabular-nums font-medium">
            {formatTime(duration)}
          </span>
          <span className="text-xs text-muted-foreground">/ 3:00</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={handleStop}
            disabled={isTranscribing}
            className="h-8 w-8"
            title="Stop recording"
          >
            <StopCircle className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isTranscribing}
            className="h-8 w-8"
            title={isTranscribing ? "Sending..." : "Send to AI"}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
