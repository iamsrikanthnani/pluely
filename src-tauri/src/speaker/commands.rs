// Pluely AI Speech Detection, and capture system audio (speaker output) as a stream of f32 samples.
use crate::speaker::SpeakerInput;
use anyhow::Result;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use futures_util::StreamExt;
use hound::{WavSpec, WavWriter};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::io::Cursor;
use std::sync::{Arc};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, Listener};
use tauri_plugin_shell::ShellExt;
use tracing::{error, warn};

// VAD Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VadConfig {
    pub enabled: bool,
    pub hop_size: usize,
    pub sensitivity_rms: f32,
    pub peak_threshold: f32,
    pub silence_chunks: usize,
    pub min_speech_chunks: usize,
    pub pre_speech_chunks: usize,
    pub noise_gate_threshold: f32,
    pub max_recording_duration_secs: u64,
}

impl Default for VadConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            hop_size: 1024,
            sensitivity_rms: 0.012,           // Much less sensitive - only real speech
            peak_threshold: 0.035,            // Higher threshold - filters clicks/noise
            silence_chunks: 18,               // ~0.4s - FASTER response for real-time
            min_speech_chunks: 7,             // ~0.16s - captures short answers
            pre_speech_chunks: 12,            // ~0.27s - enough to catch word start
            noise_gate_threshold: 0.003,      // Stronger noise filtering
            max_recording_duration_secs: 180, // 3 minutes default
        }
    }
}


#[tauri::command]
pub async fn start_system_audio_capture(
    app: AppHandle,
    vad_config: Option<VadConfig>,
    device_id: Option<String>,
) -> Result<(), String> {

    let state = app.state::<crate::AudioState>();
    
    // Check if already capturing (atomic check)
    {
        let guard = state.stream_task.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        if guard.is_some() {
            warn!("Capture already running");
            return Err("Capture already running".to_string());
        }
    }

    // Update VAD config if provided
    if let Some(config) = vad_config {
        let mut vad_cfg = state.vad_config.lock()
            .map_err(|e| format!("Failed to acquire VAD config lock: {}", e))?;
        *vad_cfg = config;
    }

    let input = SpeakerInput::new_with_device(device_id).map_err(|e| {
        error!("Failed to create speaker input: {}", e);
        format!("Failed to access system audio: {}", e)
    })?;
    
    let stream = input.stream();
    let sr = stream.sample_rate();
    
    // Validate sample rate
    if !(8000..=96000).contains(&sr) {
        error!("Invalid sample rate: {}", sr);
        return Err(format!("Invalid sample rate: {}. Expected 8000-96000 Hz", sr));
    }

    let app_clone = app.clone();
    let vad_config = state.vad_config.lock()
        .map_err(|e| format!("Failed to read VAD config: {}", e))?
        .clone();
    
    // Mark as capturing BEFORE spawning task
    *state.is_capturing.lock()
        .map_err(|e| format!("Failed to set capturing state: {}", e))? = true;
    
    // Emit capture started event
    let _ = app_clone.emit("capture-started", sr);
    
    let state_clone = app.state::<crate::AudioState>();
    let task = tokio::spawn(async move {
        if vad_config.enabled {
            run_vad_capture(app_clone.clone(), stream, sr, vad_config).await;
        } else {
            run_continuous_capture(app_clone.clone(), stream, sr, vad_config).await;
        }
        
        let state = app_clone.state::<crate::AudioState>();
        {
            if let Ok(mut guard) = state.stream_task.lock() {
                *guard = None;
            };
        }
    });

    *state_clone.stream_task.lock()
        .map_err(|e| format!("Failed to store task: {}", e))? = Some(task);
    
    Ok(())
}

// VAD-enabled capture - OPTIMIZED for real-time speech detection
async fn run_vad_capture(
    app: AppHandle,
    stream: impl StreamExt<Item = f32> + Unpin,
    sr: u32,
    config: VadConfig,
) {
    let mut stream = stream;
    let mut buffer: VecDeque<f32> = VecDeque::new();
    let mut pre_speech: VecDeque<f32> = VecDeque::with_capacity(config.pre_speech_chunks * config.hop_size);
    let mut speech_buffer = Vec::new();
    let mut in_speech = false;
    let mut silence_chunks = 0;
    let mut speech_chunks = 0;
    let max_samples = sr as usize * 30; // 30s safety cap per utterance
    let force_send_flag = Arc::new(AtomicBool::new(false));
    let force_send_listener_flag = force_send_flag.clone();
    let force_listener = app.listen("force-send-vad", move |_| {
        force_send_listener_flag.store(true, Ordering::Release);
    });

    while let Some(sample) = stream.next().await {
        buffer.push_back(sample);

        // Process in fixed chunks for VAD analysis
        while buffer.len() >= config.hop_size {
            let mut mono = Vec::with_capacity(config.hop_size);
            for _ in 0..config.hop_size {
                if let Some(v) = buffer.pop_front() {
                    mono.push(v);
                }
            }

            // Apply noise gate BEFORE VAD (critical for accuracy)
            let mono = apply_noise_gate(&mono, config.noise_gate_threshold);
            
            let (rms, peak) = calculate_audio_metrics(&mono);
            let is_speech = rms > config.sensitivity_rms || peak > config.peak_threshold;

            if is_speech {
                if !in_speech {
                    // Speech START detected
                    in_speech = true;
                    speech_chunks = 0;
                    
                    // Include pre-speech buffer for natural sound
                    speech_buffer.extend(pre_speech.drain(..));
                    
                    let _ = app.emit("speech-start", ());
                }
                
                speech_chunks += 1;
                speech_buffer.extend_from_slice(&mono);
                silence_chunks = 0; // Reset silence counter on any speech
                
                // Safety cap: force emit if exceeds 30s
                if speech_buffer.len() > max_samples {
                    let normalized_buffer = normalize_audio_level(&speech_buffer, 0.1);
                    if let Ok(b64) = samples_to_wav_b64(sr, &normalized_buffer) {
                        // let duration = speech_buffer.len() as f32 / sr as f32;
                        let _ = app.emit("speech-detected", b64);
                    }
                    speech_buffer.clear();
                    in_speech = false;
                    speech_chunks = 0;
                }
            } else {
                // Silence detected
                if in_speech {
                    silence_chunks += 1;
                    
                    // Continue collecting during silence (important for natural speech)
                    speech_buffer.extend_from_slice(&mono);
                    
                    // Check if silence duration exceeds threshold
                    if silence_chunks >= config.silence_chunks {
                        // Verify minimum speech duration
                        if speech_chunks >= config.min_speech_chunks && !speech_buffer.is_empty() {
                            // Trim trailing silence (keep ~0.15s for natural ending)
                            let silence_duration_samples = silence_chunks * config.hop_size;
                            let keep_silence_samples = (sr as usize) * 15 / 100; // 0.15s
                            let trim_amount = silence_duration_samples.saturating_sub(keep_silence_samples);
                            
                            if speech_buffer.len() > trim_amount {
                                speech_buffer.truncate(speech_buffer.len() - trim_amount);
                            }
                            
                            // Emit complete speech segment
                            let normalized_buffer = normalize_audio_level(&speech_buffer, 0.1);
                            if let Ok(b64) = samples_to_wav_b64(sr, &normalized_buffer) {
                                // let duration = speech_buffer.len() as f32 / sr as f32;
                                let _ = app.emit("speech-detected", b64);
                            } else {
                                error!("Failed to encode speech to WAV");
                                let _ = app.emit("audio-encoding-error", "Failed to encode speech");
                            }
                        } else {
                            let _ = app.emit("speech-discarded", "Audio too short (likely background noise)");
                        }
                        
                        // Reset for next speech detection
                        speech_buffer.clear();
                        in_speech = false;
                        silence_chunks = 0;
                        speech_chunks = 0;
                    }
                } else {
                    // Not in speech yet - maintain rolling pre-speech buffer
                    pre_speech.extend(mono.into_iter());
                    
                    // Trim excess (maintain fixed size)
                    while pre_speech.len() > config.pre_speech_chunks * config.hop_size {
                        pre_speech.pop_front();
                    }
                    
                    // Periodically shrink capacity to prevent memory bloat
                    if pre_speech.len() == config.pre_speech_chunks * config.hop_size {
                        pre_speech.shrink_to_fit();
                    }
                }
            }

            if force_send_flag.swap(false, Ordering::AcqRel) {
                let mut flush_buffer =
                    Vec::with_capacity(pre_speech.len() + speech_buffer.len());
                flush_buffer.extend(pre_speech.iter().copied());
                flush_buffer.extend_from_slice(&speech_buffer);

                if flush_buffer.is_empty() {
                    let _ = app.emit("audio-encoding-error", "No audio available to send");
                } else {
                    let normalized_buffer = normalize_audio_level(&flush_buffer, 0.1);
                    match samples_to_wav_b64(sr, &normalized_buffer) {
                        Ok(b64) => {
                            let _ = app.emit("speech-detected", b64);
                        }
                        Err(e) => {
                            error!("Failed to encode forced VAD audio: {}", e);
                            let _ = app.emit("audio-encoding-error", "Failed to encode audio");
                        }
                    }
                }

                speech_buffer.clear();
                pre_speech.clear();
                in_speech = false;
                silence_chunks = 0;
                speech_chunks = 0;
            }
        }
    }
    app.unlisten(force_listener);
}

// Continuous capture (VAD disabled)
async fn run_continuous_capture(
    app: AppHandle,
    stream: impl StreamExt<Item = f32> + Unpin,
    sr: u32,
    config: VadConfig,
) {
    let mut stream = stream;
    let max_samples = (sr as u64 * config.max_recording_duration_secs) as usize;
    
    // Pre-allocate buffer to prevent reallocations
    let mut audio_buffer = Vec::with_capacity(max_samples);
    let start_time = Instant::now();
    let max_duration = Duration::from_secs(config.max_recording_duration_secs);
    
    // Atomic flag for manual stop
    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_flag_for_listener = stop_flag.clone();
    
    
    // Listen for manual stop event
    let stop_listener = app.listen("manual-stop-continuous", move |_| {
        stop_flag_for_listener.store(true, Ordering::Release);
    });
    
    // Emit recording started
    let _ = app.emit("continuous-recording-start", config.max_recording_duration_secs);

    // Accumulate audio - check stop flag on EVERY sample for immediate response
    loop {
        // Check stop flag FIRST on every iteration for immediate stopping
        if stop_flag.load(Ordering::Acquire) {
            break;
        }
        
        tokio::select! {
            sample_opt = stream.next() => {
                match sample_opt {
                    Some(sample) => {
                        if stop_flag.load(Ordering::Acquire) {
                            break;
                        }
                        
                        audio_buffer.push(sample);
                        
                        let elapsed = start_time.elapsed();
                        
                        // Emit progress every second
                        if audio_buffer.len() % (sr as usize) == 0 {
                            let _ = app.emit("recording-progress", elapsed.as_secs());
                        }
                        
                        // Check size limit (safety)
                        if audio_buffer.len() >= max_samples {
                            break;
                        }
                        
                        // Check time limit
                        if elapsed >= max_duration {
                            break;
                        }
                    },
                    None => {
                        warn!("Audio stream ended unexpectedly");
                        break;
                    }
                }
            }
            _ = tokio::time::sleep(tokio::time::Duration::from_millis(10)) => {
            }
        }
    }
    
    // Clean up event listener (CRITICAL)
    app.unlisten(stop_listener);
    
    // Process and emit audio
    if !audio_buffer.is_empty() {
        // let duration = start_time.elapsed().as_secs_f32();

        // Apply noise gate
        let cleaned_audio = apply_noise_gate(&audio_buffer, config.noise_gate_threshold);
        let cleaned_audio = normalize_audio_level(&cleaned_audio, 0.1);
        
        match samples_to_wav_b64(sr, &cleaned_audio) {
            Ok(b64) => {
                let _ = app.emit("speech-detected", b64);
            }
            Err(e) => {
                error!("Failed to encode continuous audio: {}", e);
                let _ = app.emit("audio-encoding-error", e);
            }
        }
    } else {
        warn!("No audio captured in continuous mode");
        let _ = app.emit("audio-encoding-error", "No audio recorded");
    }
    
    let _ = app.emit("continuous-recording-stopped", ());
}

// Apply noise gate
fn apply_noise_gate(samples: &[f32], threshold: f32) -> Vec<f32> {
    const KNEE_RATIO: f32 = 3.0; // Compression ratio for soft knee

    samples
        .iter()
        .map(|&s| {
            let abs = s.abs();
            if abs < threshold {
                s * (abs / threshold).powf(1.0 / KNEE_RATIO)
            } else {
                s
            }
        })
        .collect()
}

// Calculate RMS and peak (optimized)
fn calculate_audio_metrics(chunk: &[f32]) -> (f32, f32) {
    let mut sumsq = 0.0f32;
    let mut peak = 0.0f32;
    
    for &v in chunk {
        let a = v.abs();
        peak = peak.max(a);
        sumsq += v * v;
    }
    
    let rms = (sumsq / chunk.len() as f32).sqrt();
    (rms, peak)
}

fn normalize_audio_level(samples: &[f32], target_rms: f32) -> Vec<f32> {
    if samples.is_empty() {
        return Vec::new();
    }
    
    let sum_squares: f32 = samples.iter().map(|&s| s * s).sum();
    let current_rms = (sum_squares / samples.len() as f32).sqrt();
    
    if current_rms < 0.001 {
        return samples.to_vec();
    }
    
    let gain = (target_rms / current_rms).min(10.0);
    
    samples.iter()
        .map(|&s| {
            let amplified = s * gain;
            if amplified.abs() > 1.0 {
                amplified.signum() * (1.0 - (-amplified.abs()).exp())
            } else {
                amplified
            }
        })
        .collect()
}

// Convert samples to WAV base64 (with proper error handling)
fn samples_to_wav_b64(sample_rate: u32, mono_f32: &[f32]) -> Result<String, String> {
    // Validate sample rate
    if !(8000..=96000).contains(&sample_rate) {
        error!("Invalid sample rate: {}", sample_rate);
        return Err(format!("Invalid sample rate: {}. Expected 8000-96000 Hz", sample_rate));
    }
    
    // Validate buffer
    if mono_f32.is_empty() {
        return Err("Empty audio buffer".to_string());
    }
    
    let mut cursor = Cursor::new(Vec::new());
    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = WavWriter::new(&mut cursor, spec)
        .map_err(|e| {
            error!("Failed to create WAV writer: {}", e);
            e.to_string()
        })?;

    for &s in mono_f32 {
        let clamped = s.clamp(-1.0, 1.0);
        let sample_i16 = (clamped * i16::MAX as f32) as i16;
        writer.write_sample(sample_i16)
            .map_err(|e| e.to_string())?;
    }
    
    writer.finalize()
        .map_err(|e| e.to_string())?;
    
    Ok(B64.encode(cursor.into_inner()))
}

#[tauri::command]
pub async fn stop_system_audio_capture(app: AppHandle) -> Result<(), String> {    
    let state = app.state::<crate::AudioState>();
    
    // Abort task in separate scope (Send trait fix)
    {
        let mut guard = state.stream_task.lock()
            .map_err(|e| format!("Failed to acquire task lock: {}", e))?;
        
        if let Some(task) = guard.take() {
            task.abort();
        }
    }
    
    // LONGER delay for proper cleanup (300ms instead of 150ms)
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    
    // Mark as not capturing
    *state.is_capturing.lock()
        .map_err(|e| format!("Failed to update capturing state: {}", e))? = false;
    
    // Additional cleanup delay (CRITICAL for mic indicator)
    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    
    // Emit stopped event
    let _ = app.emit("capture-stopped", ());
    Ok(())
}

/// Manual stop for continuous recording
#[tauri::command]
pub async fn manual_stop_continuous(app: AppHandle) -> Result<(), String> {
    let _ = app.emit("manual-stop-continuous", ());
    
    tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;
    
    Ok(())
}

/// Force emit current VAD buffer without waiting for silence
#[tauri::command]
pub async fn force_send_vad(app: AppHandle) -> Result<(), String> {
    let state = app.state::<crate::AudioState>();

    let is_capturing = state
        .is_capturing
        .lock()
        .map_err(|e| format!("Failed to read capture state: {}", e))?;
    if !*is_capturing {
        return Err("System audio capture is not active".to_string());
    }
    drop(is_capturing);

    let vad_config = state
        .vad_config
        .lock()
        .map_err(|e| format!("Failed to read VAD config: {}", e))?;
    if !vad_config.enabled {
        return Err("Voice Activity Detection mode is not enabled".to_string());
    }
    drop(vad_config);

    app.emit("force-send-vad", ())
        .map_err(|e| format!("Failed to emit VAD send event: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn check_system_audio_access(_app: AppHandle) -> Result<bool, String> {    
    match SpeakerInput::new() {
        Ok(_) => {
            Ok(true)
        }
        Err(e) => {
            error!("System audio access check failed: {}", e);
            Ok(false)
        }
    }
}

#[tauri::command]
pub async fn request_system_audio_access(app: AppHandle) -> Result<(), String> {    
    #[cfg(target_os = "macos")]
    {
        app.shell()
            .command("open")
            .args(["x-apple.systempreferences:com.apple.preference.security?Privacy_AudioCapture"])
            .spawn()
            .map_err(|e| {
                error!("Failed to open system preferences: {}", e);
                e.to_string()
            })?;
    }
    #[cfg(target_os = "windows")]
    {
        app.shell()
            .command("ms-settings:sound")
            .spawn()
            .map_err(|e| {
                error!("Failed to open sound settings: {}", e);
                e.to_string()
            })?;
    }
    #[cfg(target_os = "linux")]
    {
        let commands = ["pavucontrol", "gnome-control-center sound"];
        let mut opened = false;
        
        for cmd in &commands {
            if app.shell()
                .command(cmd)
                .spawn()
                .is_ok()
            {
                opened = true;
                break;
            }
        }
        
        if !opened {
            warn!("Failed to open audio settings on Linux");
        }
    }
    
    Ok(())
}

// VAD Configuration Management
#[tauri::command]
pub async fn get_vad_config(app: AppHandle) -> Result<VadConfig, String> {
    let state = app.state::<crate::AudioState>();
    let config = state.vad_config.lock()
        .map_err(|e| format!("Failed to get VAD config: {}", e))?
        .clone();
    Ok(config)
}

#[tauri::command]
pub async fn update_vad_config(app: AppHandle, config: VadConfig) -> Result<(), String> {    
    // Validate config
    if config.sensitivity_rms < 0.0 || config.sensitivity_rms > 1.0 {
        return Err("Invalid sensitivity_rms: must be 0.0-1.0".to_string());
    }
    if config.max_recording_duration_secs > 3600 {
        return Err("Invalid max_recording_duration_secs: must be <= 3600 (1 hour)".to_string());
    }
    
    let state = app.state::<crate::AudioState>();
    *state.vad_config.lock()
        .map_err(|e| format!("Failed to update VAD config: {}", e))? = config;
    
    Ok(())
}

#[tauri::command]
pub async fn get_capture_status(app: AppHandle) -> Result<bool, String> {
    let state = app.state::<crate::AudioState>();
    let is_capturing = *state.is_capturing.lock()
        .map_err(|e| format!("Failed to get capture status: {}", e))?;
    Ok(is_capturing)
}

#[tauri::command]
pub fn get_audio_sample_rate(_app: AppHandle) -> Result<u32, String> {
    let input = SpeakerInput::new()
        .map_err(|e| {
            error!("Failed to create speaker input: {}", e);
            format!("Failed to access system audio: {}", e)
        })?;
    
    let stream = input.stream();
    let sr = stream.sample_rate();
    
    Ok(sr)
}
