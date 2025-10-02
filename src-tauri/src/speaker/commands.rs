// Pluely AI Speech Detection, and capture system audio (speaker output) as a stream of f32 samples.
use tauri::{AppHandle, Emitter, Manager};
use futures_util::StreamExt;
#[cfg(any(target_os = "macos", target_os = "windows"))]
use tauri_plugin_shell::ShellExt as _;
use crate::speaker::{SpeakerInput};
use anyhow::Result;
use hound::{WavSpec, WavWriter};
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose::STANDARD as B64};
use std::collections::VecDeque;

// Pluely AI Speech Detection
const HOP_SIZE: usize = 1024;  // Analysis chunk size (~23ms at 44.1kHz, ~21ms at 48kHz)
const VAD_SENSITIVITY_RMS: f32 = 0.004;  // RMS sensitivity for VAD
const SPEECH_PEAK_THRESHOLD: f32 = 0.01;  // Peak threshold for VAD
const SILENCE_CHUNKS: usize = 47;  // ~1s silence to end speech
const MIN_SPEECH_CHUNKS: usize = 15;  // ~0.32s min speech duration
const PRE_SPEECH_CHUNKS: usize = 15;  // ~0.32s pre-speech buffer

#[tauri::command]
pub async fn start_system_audio_capture(app: AppHandle) -> Result<(), String> {
    let state = app.state::<crate::AudioState>();
    let mut guard = state.stream_task.lock().unwrap();

    if guard.is_some() {
        return Err("Capture already running".to_string());
    }

    let input = SpeakerInput::new().map_err(|e| e.to_string())?;
    let mut stream = input.stream();
    let sr = stream.sample_rate();

    let app_clone = app.clone();
    let task = tokio::spawn(async move {
        let mut buffer: VecDeque<f32> = VecDeque::new();  // Raw f32 from stream
        let mut pre_speech: VecDeque<f32> = VecDeque::new();  // Pre-speech buffer
        let mut speech_buffer = Vec::new();  // Collected speech
        let mut in_speech = false;
        let mut silence_chunks = 0;
        let mut speech_chunks = 0;
        let max_samples = sr as usize * 30;  // Safety cap: 30s

        while let Some(sample) = stream.next().await {
            buffer.push_back(sample);

            // Process in chunks
            while buffer.len() >= HOP_SIZE {
                let mut mono = Vec::with_capacity(HOP_SIZE);
                for _ in 0..HOP_SIZE {
                    if let Some(v) = buffer.pop_front() {
                        mono.push(v);
                    }
                }

                let (rms, peak) = process_chunk(&mono);
                    let is_speech = rms > VAD_SENSITIVITY_RMS || peak > SPEECH_PEAK_THRESHOLD;

                    if is_speech {
                        if !in_speech {
                            in_speech = true;
                            speech_chunks = 0;
                            silence_chunks = 0;
                            speech_buffer.extend(pre_speech.drain(..));  // Prepend pre-speech
                            let _ = app_clone.emit("speech-start", ()).map_err(|e| eprintln!("emit speech-start failed: {}", e));
                        }
                        speech_chunks += 1;
                        speech_buffer.extend_from_slice(&mono);
                        if speech_buffer.len() > max_samples {
                            // Force emit
                            if let Ok(b64) = samples_to_wav_b64(sr, &speech_buffer) {
                                let _ = app_clone.emit("speech-detected", b64).map_err(|e| eprintln!("emit speech-detected failed: {}", e));
                            }
                            speech_buffer.clear();
                            in_speech = false;
                        }
                    } else {
                        if in_speech {
                            silence_chunks += 1;
                            speech_buffer.extend_from_slice(&mono);
                            if silence_chunks >= SILENCE_CHUNKS {
                                if speech_chunks >= MIN_SPEECH_CHUNKS && !speech_buffer.is_empty() {
                                    // Trim trailing silence
                                    let trim = (SILENCE_CHUNKS / 2) * HOP_SIZE;
                                    if speech_buffer.len() > trim {
                                        speech_buffer.truncate(speech_buffer.len() - trim);
                                    }
                                    if let Ok(b64) = samples_to_wav_b64(sr, &speech_buffer) {
                                        let _ = app_clone.emit("speech-detected", b64).map_err(|e| eprintln!("emit speech-detected failed: {}", e));
                                    }
                                }
                                speech_buffer.clear();
                                in_speech = false;
                                silence_chunks = 0;
                                speech_chunks = 0;
                            }
                        } else {
                            // Not in speech: maintain pre-speech buffer
                            pre_speech.extend(mono.into_iter());
                            while pre_speech.len() > PRE_SPEECH_CHUNKS * HOP_SIZE {
                                pre_speech.pop_front();
                            }
                        }
                    }
            }
        }
    });

    *guard = Some(task);
    Ok(())
}

// Process a chunk for Pluely AI Speech Detection (RMS and peak calculation)
fn process_chunk(mono_chunk: &[f32]) -> (f32, f32) {
    let mut sumsq = 0.0f32;
    let mut peak = 0.0f32;
    for &v in mono_chunk {
        let a = v.abs();
        peak = peak.max(a);
        sumsq += v * v;
    }
    let rms = (sumsq / mono_chunk.len() as f32).sqrt();
    (rms, peak)
}

// Send samples to Pluely AI Speech
fn samples_to_wav_b64(sample_rate: u32, mono_f32: &[f32]) -> Result<String, String> {
    let mut cursor = Cursor::new(Vec::new());
    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = WavWriter::new(&mut cursor, spec).map_err(|e| e.to_string())?;

    for &s in mono_f32 {
        let clamped = s.clamp(-1.0, 1.0);
        let sample_i16 = (clamped * i16::MAX as f32) as i16;
        writer.write_sample(sample_i16).map_err(|e| e.to_string())?;
    }
    writer.finalize().map_err(|e| e.to_string())?;
    Ok(B64.encode(cursor.into_inner()))
}

#[tauri::command]
pub async fn stop_system_audio_capture(app: AppHandle) -> Result<(), String> {
    let state = app.state::<crate::AudioState>();
    let mut guard = state.stream_task.lock().unwrap();

    if let Some(task) = guard.take() {
        task.abort();
    }
    Ok(())
}

#[tauri::command]
pub async fn check_system_audio_access(_app: AppHandle) -> Result<bool, String> {
    let mut stream = SpeakerInput::new().map_err(|e| e.to_string())?.stream();
    Ok(stream.next().await.is_some())
}

#[tauri::command]
pub async fn request_system_audio_access(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        app.shell().command("open").args(["x-apple.systempreferences:com.apple.preference.security?Privacy_AudioCapture"]).spawn().map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        app.shell().command("ms-settings:sound").spawn().map_err(|e| e.to_string())?;
    }
    let _ = app; // silence unused on other targets
    Ok(())
}