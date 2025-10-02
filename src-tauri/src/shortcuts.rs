use tauri::{AppHandle, Manager, Runtime, Emitter};
use crate::window as winpos;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState as GSState};
use serde_json::json;
use serde::Deserialize;
use std::sync::Mutex;
// State for window visibility
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
pub struct WindowVisibility(pub Mutex<bool>);

#[derive(Clone, Debug)]
pub struct ShortcutConfig {
    pub toggle: String,
    pub audio: String,
    pub screenshot: String,
    pub system_audio: String,
    pub move_left: String,
    pub move_right: String,
    pub move_up: String,
    pub move_down: String,
}

impl Default for ShortcutConfig {
    fn default() -> Self {
        Self {
            toggle: DEFAULT_TOGGLE_SHORTCUT.to_string(),
            audio: DEFAULT_AUDIO_SHORTCUT.to_string(),
            screenshot: DEFAULT_SCREENSHOT_SHORTCUT.to_string(),
            system_audio: DEFAULT_SYSTEM_AUDIO_SHORTCUT.to_string(),
            move_left: "ctrl+left".to_string(),
            move_right: "ctrl+right".to_string(),
            move_up: "ctrl+up".to_string(),
            move_down: "ctrl+down".to_string(),
        }
    }
}

#[derive(Default)]
pub struct ShortcutStore(pub Mutex<ShortcutConfig>);

// Default shortcuts
#[cfg(target_os = "macos")]
const DEFAULT_TOGGLE_SHORTCUT: &str = "cmd+backslash";
#[cfg(not(target_os = "macos"))]
const DEFAULT_TOGGLE_SHORTCUT: &str = "ctrl+backslash";

#[cfg(target_os = "macos")]
const DEFAULT_AUDIO_SHORTCUT: &str = "cmd+shift+a";
#[cfg(not(target_os = "macos"))]
const DEFAULT_AUDIO_SHORTCUT: &str = "ctrl+shift+a";

#[cfg(target_os = "macos")]
const DEFAULT_SCREENSHOT_SHORTCUT: &str = "cmd+shift+s";
#[cfg(not(target_os = "macos"))]
const DEFAULT_SCREENSHOT_SHORTCUT: &str = "ctrl+shift+s";

#[cfg(target_os = "macos")]
const DEFAULT_SYSTEM_AUDIO_SHORTCUT: &str = "cmd+shift+m";
#[cfg(not(target_os = "macos"))]
const DEFAULT_SYSTEM_AUDIO_SHORTCUT: &str = "ctrl+shift+m";

/// Initialize global shortcuts for the application
pub fn setup_global_shortcuts<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let cfg = if let Some(state) = app.try_state::<ShortcutStore>() {
        state.0.lock().unwrap().clone()
    } else {
        ShortcutConfig::default()
    };
    setup_global_shortcuts_with_config(app, cfg)
}

fn setup_global_shortcuts_with_config<R: Runtime>(app: &AppHandle<R>, cfg: ShortcutConfig) -> Result<(), Box<dyn std::error::Error>> {
    let toggle_shortcut = cfg.toggle.parse::<Shortcut>()?;
    let audio_shortcut = cfg.audio.parse::<Shortcut>()?;
    let screenshot_shortcut = cfg.screenshot.parse::<Shortcut>()?;
    let system_audio_shortcut = cfg.system_audio.parse::<Shortcut>()?;
    let move_left_shortcut = cfg.move_left.parse::<Shortcut>()?;
    let move_right_shortcut = cfg.move_right.parse::<Shortcut>()?;
    let move_up_shortcut = cfg.move_up.parse::<Shortcut>()?;
    let move_down_shortcut = cfg.move_down.parse::<Shortcut>()?;

     
    // Register global shortcuts
    app.global_shortcut().on_shortcut(toggle_shortcut, move |app, _shortcut, event| {
        if event.state() == GSState::Pressed {
            handle_toggle_window(&app);
        }
    }).map_err(|e| format!("Failed to register toggle shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut().on_shortcut(audio_shortcut, move |_app, _shortcut, event| {
        if event.state() == GSState::Pressed {
            handle_audio_shortcut(&app_handle);
        }
    }).map_err(|e| format!("Failed to register audio shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut().on_shortcut(screenshot_shortcut, move |_app, _shortcut, event| {
        if event.state() == GSState::Pressed {
            handle_screenshot_shortcut(&app_handle);
        }
    }).map_err(|e| format!("Failed to register screenshot shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut().on_shortcut(system_audio_shortcut, move |_app, _shortcut, event| {
        if event.state() == GSState::Pressed {
            handle_system_audio_shortcut(&app_handle);
        }
    }).map_err(|e| format!("Failed to register system audio shortcut: {}", e))?;

    // Positioning shortcuts (Ctrl+Arrow)
    app.global_shortcut().on_shortcut(move_left_shortcut, move |app, _shortcut, event| {
        if event.state() == GSState::Pressed { move_window(app, Direction::Left); }
    }).map_err(|e| format!("Failed to register move left shortcut: {}", e))?;

    app.global_shortcut().on_shortcut(move_right_shortcut, move |app, _shortcut, event| {
        if event.state() == GSState::Pressed { move_window(app, Direction::Right); }
    }).map_err(|e| format!("Failed to register move right shortcut: {}", e))?;

    app.global_shortcut().on_shortcut(move_up_shortcut, move |app, _shortcut, event| {
        if event.state() == GSState::Pressed { move_window(app, Direction::Up); }
    }).map_err(|e| format!("Failed to register move up shortcut: {}", e))?;

    app.global_shortcut().on_shortcut(move_down_shortcut, move |app, _shortcut, event| {
        if event.state() == GSState::Pressed { move_window(app, Direction::Down); }
    }).map_err(|e| format!("Failed to register move down shortcut: {}", e))?;

    // Ensure shortcuts are registered (avoid double-registration errors)
    for sc in [
        cfg.toggle.as_str(),
        cfg.audio.as_str(),
        cfg.screenshot.as_str(),
        cfg.system_audio.as_str(),
        cfg.move_left.as_str(),
        cfg.move_right.as_str(),
        cfg.move_up.as_str(),
        cfg.move_down.as_str(),
    ] {
        let sc_parsed = sc.parse::<Shortcut>()?;
        if !app.global_shortcut().is_registered(sc_parsed) {
            app.global_shortcut()
                .register(sc.parse::<Shortcut>()?)
                .map_err(|e| format!("Failed to register shortcut '{}': {}", sc, e))?;
        }
    }
    
    Ok(())
}

/// Handle app toggle (hide/show) with input focus and app icon management
fn handle_toggle_window<R: Runtime>(app: &AppHandle<R>) {
    // Get the main window
    let Some(window) = app.get_webview_window("main") else {
        eprintln!("Main window not found");
        return;
    };

    #[cfg(target_os = "windows")]
    {
        let state = app.state::<WindowVisibility>();
        let mut is_hidden = state.0.lock().unwrap();
        *is_hidden = !*is_hidden;

        if let Err(e) = window.emit("toggle-window-visibility", *is_hidden) {
            eprintln!("Failed to emit toggle-window-visibility event: {}", e);
        }
        return;
    }

    #[cfg(not(target_os = "windows"))]
    match window.is_visible() {
        Ok(true) => {
            // Window is visible, hide it and handle app icon based on user settings
            if let Err(e) = window.hide() {
                eprintln!("Failed to hide window: {}", e);
            }

         }
        Ok(false) => {
            // Window is hidden, show it and handle app icon based on user settings
            if let Err(e) = window.show() {
                eprintln!("Failed to show window: {}", e);
            }

            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }

            // Emit event to focus text input
            if let Err(e) = window.emit("focus-text-input", json!({})) {
                eprintln!("Failed to emit focus event: {}", e);
            }
        }
        Err(e) => {
            eprintln!("Failed to check window visibility: {}", e);
        }
    }
}


/// Handle audio shortcut
fn handle_audio_shortcut<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        // Ensure window is visible
        if let Ok(false) = window.is_visible() {
            if let Err(e) = window.show() {
                eprintln!("Failed to show window: {}", e);
                return;
            }
            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }
        }
        
        // Emit event to start audio recording
        if let Err(e) = window.emit("start-audio-recording", json!({})) {
            eprintln!("Failed to emit audio recording event: {}", e);
        }
    }
}

/// Handle screenshot shortcut - mode will be determined by user settings in frontend
fn handle_screenshot_shortcut<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        // Emit event to trigger screenshot - frontend will determine auto/manual mode
        if let Err(e) = window.emit("trigger-screenshot", json!({})) {
            eprintln!("Failed to emit screenshot event: {}", e);
        }
    }
}

/// Handle system audio shortcut
fn handle_system_audio_shortcut<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        // Ensure window is visible
        if let Ok(false) = window.is_visible() {
            if let Err(e) = window.show() {
                eprintln!("Failed to show window: {}", e);
                return;
            }
            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }
        }
        
        // Emit event to toggle system audio capture - frontend will determine current state
        if let Err(e) = window.emit("toggle-system-audio", json!({})) {
            eprintln!("Failed to emit system audio event: {}", e);
        }
    }
}

#[derive(Copy, Clone)]
enum Direction { Left, Right, Up, Down }

fn move_window<R: Runtime>(app: &AppHandle<R>, dir: Direction) {
    let Some(window) = app.get_webview_window("main") else { return; };
    // Use helpers in window.rs to snap
    let _ = (|| -> Result<(), Box<dyn std::error::Error>> {
        match dir {
            Direction::Left => {
                // Left-center edge
                winpos::position_window_left_center(&window, 0)?;
            }
            Direction::Right => {
                // Right-center edge
                winpos::position_window_right_center(&window, 0)?;
            }
            Direction::Up => {
                // Top-center edge
                winpos::position_window_top_center(&window, 0)?;
            }
            Direction::Down => {
                // Bottom-center edge
                winpos::position_window_bottom_center(&window, 0)?;
            }
        }
        Ok(())
    })();
}

/// Tauri command to get current shortcuts
#[tauri::command]
pub fn get_shortcuts() -> serde_json::Value {
    json!({
        "toggle": DEFAULT_TOGGLE_SHORTCUT,
        "audio": DEFAULT_AUDIO_SHORTCUT,
        "screenshot": DEFAULT_SCREENSHOT_SHORTCUT,
        "systemAudio": DEFAULT_SYSTEM_AUDIO_SHORTCUT,
        "moveLeft": "ctrl+left",
        "moveRight": "ctrl+right",
        "moveUp": "ctrl+up",
        "moveDown": "ctrl+down"
    })
}

#[derive(Deserialize)]
pub struct ShortcutUpdate {
    #[serde(default)] pub toggle: Option<String>,
    #[serde(default)] pub audio: Option<String>,
    #[serde(default)] pub screenshot: Option<String>,
    #[serde(rename = "systemAudio", default)] pub system_audio: Option<String>,
    #[serde(rename = "moveLeft", default)] pub move_left: Option<String>,
    #[serde(rename = "moveRight", default)] pub move_right: Option<String>,
    #[serde(rename = "moveUp", default)] pub move_up: Option<String>,
    #[serde(rename = "moveDown", default)] pub move_down: Option<String>,
}

#[tauri::command]
pub fn set_shortcuts<R: Runtime>(app: AppHandle<R>, update: ShortcutUpdate) -> Result<(), String> {
    // Update state
    let state = app.state::<ShortcutStore>();
    {
        let mut cfg = state.0.lock().map_err(|e| e.to_string())?;
        let mut next = cfg.clone();
        if let Some(v) = update.toggle { next.toggle = v; }
        if let Some(v) = update.audio { next.audio = v; }
        if let Some(v) = update.screenshot { next.screenshot = v; }
        if let Some(v) = update.system_audio { next.system_audio = v; }
        if let Some(v) = update.move_left { next.move_left = v; }
        if let Some(v) = update.move_right { next.move_right = v; }
        if let Some(v) = update.move_up { next.move_up = v; }
        if let Some(v) = update.move_down { next.move_down = v; }
        *cfg = next;
    }

    // Rebind all
    app.global_shortcut().unregister_all().map_err(|e| e.to_string())?;
    let cfg = state.0.lock().map_err(|e| e.to_string())?.clone();
    setup_global_shortcuts_with_config(&app, cfg).map_err(|e| e.to_string())?;
    Ok(())
}

/// Tauri command to check if shortcuts are registered
#[tauri::command]
pub fn check_shortcuts_registered<R: Runtime>(app: AppHandle<R>) -> Result<bool, String> {
    let shortcuts = [
        DEFAULT_TOGGLE_SHORTCUT,
        DEFAULT_AUDIO_SHORTCUT,
        DEFAULT_SCREENSHOT_SHORTCUT,
        DEFAULT_SYSTEM_AUDIO_SHORTCUT,
    ];

    for shortcut_str in shortcuts {
        if let Ok(shortcut) = shortcut_str.parse::<Shortcut>() {
            let registered = app.global_shortcut().is_registered(shortcut);
            if !registered {
                return Ok(false);
            }
        } else {
            return Err(format!("Failed to parse shortcut: {}", shortcut_str));
        }
    }
    
    Ok(true)
}
// Tauri command to set app icon visibility in dock/taskbar
#[tauri::command]
pub fn set_app_icon_visibility<R: Runtime>(
    app: AppHandle<R>,
    visible: bool,
) -> Result<(), String> {
    println!("Setting app icon visibility to: {}", visible);
    
    #[cfg(target_os = "macos")]
    {
        // On macOS, use activation policy to control dock icon
        let policy = if visible {
            println!("Setting macOS activation policy to Regular (visible)");
            tauri::ActivationPolicy::Regular
        } else {
            println!("Setting macOS activation policy to Accessory (hidden)");
            tauri::ActivationPolicy::Accessory
        };
        
        app.set_activation_policy(policy)
            .map_err(|e| {
                eprintln!("Failed to set activation policy: {}", e);
                format!("Failed to set activation policy: {}", e)
            })?;
        
        println!("Successfully set macOS activation policy");
    }
    
    #[cfg(target_os = "windows")]
    {
        // On Windows, control taskbar icon visibility
        if let Some(window) = app.get_webview_window("main") {
            println!("Setting Windows taskbar visibility to: {}", visible);
            window.set_skip_taskbar(!visible)
                .map_err(|e| {
                    eprintln!("Failed to set taskbar visibility: {}", e);
                    format!("Failed to set taskbar visibility: {}", e)
                })?;
            println!("Successfully set Windows taskbar visibility");
        } else {
            eprintln!("Main window not found on Windows");
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        // On Linux, control panel icon visibility
        if let Some(window) = app.get_webview_window("main") {
            println!("Setting Linux panel visibility to: {}", visible);
            window.set_skip_taskbar(!visible)
                .map_err(|e| {
                    eprintln!("Failed to set panel visibility: {}", e);
                    format!("Failed to set panel visibility: {}", e)
                })?;
            println!("Successfully set Linux panel visibility");
        } else {
            eprintln!("Main window not found on Linux");
        }
    }
    
    Ok(())
}

/// Tauri command to set always on top state
#[tauri::command]
pub fn set_always_on_top<R: Runtime>(
    app: AppHandle<R>,
    enabled: bool,
) -> Result<(), String> {
    println!("Setting always on top to: {}", enabled);
    
    if let Some(window) = app.get_webview_window("main") {
        window.set_always_on_top(enabled)
            .map_err(|e| {
                eprintln!("Failed to set always on top: {}", e);
                format!("Failed to set always on top: {}", e)
            })?;
        
        println!("Successfully set always on top to: {}", enabled);
    } else {
        eprintln!("Main window not found");
        return Err("Main window not found".to_string());
    }
    
    Ok(())
}
