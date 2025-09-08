use tauri::{AppHandle, Manager, Runtime, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use serde_json::json;

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
    let toggle_shortcut = DEFAULT_TOGGLE_SHORTCUT.parse::<Shortcut>()?;
    let audio_shortcut = DEFAULT_AUDIO_SHORTCUT.parse::<Shortcut>()?;
    let screenshot_shortcut = DEFAULT_SCREENSHOT_SHORTCUT.parse::<Shortcut>()?;
    let system_audio_shortcut = DEFAULT_SYSTEM_AUDIO_SHORTCUT.parse::<Shortcut>()?;

     
    // Register global shortcuts
    app.global_shortcut().on_shortcut(toggle_shortcut, move |app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            if let Some(window) = app.get_webview_window("main") {
                handle_toggle_window(&window);
            }
        }
    }).map_err(|e| format!("Failed to register toggle shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut().on_shortcut(audio_shortcut, move |_app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            handle_audio_shortcut(&app_handle);
        }
    }).map_err(|e| format!("Failed to register audio shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut().on_shortcut(screenshot_shortcut, move |_app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            handle_screenshot_shortcut(&app_handle);
        }
    }).map_err(|e| format!("Failed to register screenshot shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut().on_shortcut(system_audio_shortcut, move |_app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            handle_system_audio_shortcut(&app_handle);
        }
    }).map_err(|e| format!("Failed to register system audio shortcut: {}", e))?;

    // Register all shortcuts
    app.global_shortcut().register(toggle_shortcut)
        .map_err(|e| format!("Failed to register toggle shortcut: {}", e))?;
    app.global_shortcut().register(audio_shortcut)
        .map_err(|e| format!("Failed to register audio shortcut: {}", e))?;
    app.global_shortcut().register(screenshot_shortcut)
        .map_err(|e| format!("Failed to register screenshot shortcut: {}", e))?;
    app.global_shortcut().register(system_audio_shortcut)
        .map_err(|e| format!("Failed to register system audio shortcut: {}", e))?;
    
    Ok(())
}

/// Handle window toggle (hide/show) with input focus and app icon management
fn handle_toggle_window<R: Runtime>(window: &tauri::WebviewWindow<R>) {
    match window.is_visible() {
        Ok(true) => {
            // Window is visible, hide it and handle app icon based on user settings
            if let Err(e) = window.hide() {
                eprintln!("Failed to hide window: {}", e);
            }
            
            // Handle app icon visibility based on user settings when hiding
            if let Err(e) = set_app_icon_visibility(window.app_handle().clone(), false) {
                eprintln!("Failed to set app icon visibility: {}", e);
            }
        }
        Ok(false) => {
            // Window is hidden, show it, show app icon, and focus input
            if let Err(e) = window.show() {
                eprintln!("Failed to show window: {}", e);
            }
            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }
            // Always show app icon when window is shown
            // Handle app icon visibility based on user settings when showing
            if let Err(e) = set_app_icon_visibility(window.app_handle().clone(), true) {
                eprintln!("Failed to set app icon visibility: {}", e);
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

/// Tauri command to get current shortcuts
#[tauri::command]
pub fn get_shortcuts() -> serde_json::Value {
    json!({
        "toggle": DEFAULT_TOGGLE_SHORTCUT,
        "audio": DEFAULT_AUDIO_SHORTCUT,
        "screenshot": DEFAULT_SCREENSHOT_SHORTCUT,
        "systemAudio": DEFAULT_SYSTEM_AUDIO_SHORTCUT
    })
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
