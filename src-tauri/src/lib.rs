// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod window;
mod shortcuts;
mod activate;
mod api;

#[cfg(target_os = "macos")]
use tauri_plugin_macos_permissions;
use xcap::Monitor;
use base64::Engine;
use image::codecs::png::PngEncoder;
use image::{ColorType, ImageEncoder};
use tauri_plugin_http;

use std::sync::{Arc, Mutex};
use tokio::task::JoinHandle;

mod speaker;

#[derive(Default)]
pub struct AudioState {
    stream_task: Arc<Mutex<Option<JoinHandle<()>>>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn set_window_height(window: tauri::WebviewWindow, height: u32) -> Result<(), String> {
    use tauri::{LogicalSize, Size};
    
    let new_size = LogicalSize::new(700.0, height as f64);
    
    match window.set_size(Size::Logical(new_size)) {
        Ok(_) => {
            if let Err(e) = window::position_window_top_center(&window, 0) {
                eprintln!("Failed to reposition window: {}", e);
            }
            Ok(())
        }
        Err(e) => Err(format!("Failed to resize window: {}", e))
    }
}

#[tauri::command]
fn capture_to_base64() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;
    let primary_monitor = monitors
        .into_iter()
        .find(|m| m.is_primary())
        .ok_or("No primary monitor found".to_string())?;

    let image = primary_monitor.capture_image().map_err(|e| format!("Failed to capture image: {}", e))?;
    let mut png_buffer = Vec::new();
    PngEncoder::new(&mut png_buffer)
        .write_image(image.as_raw(), image.width(), image.height(), ColorType::Rgba8.into())
        .map_err(|e| format!("Failed to encode to PNG: {}", e))?;
    let base64_str = base64::engine::general_purpose::STANDARD.encode(png_buffer);

    Ok(base64_str)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .manage(AudioState::default())
        .manage(shortcuts::WindowVisibility(Mutex::new(false)))
        .manage(shortcuts::ShortcutStore::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_keychain::init())
        .plugin(tauri_plugin_shell::init())  // Add shell plugin
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_app_version,
            set_window_height,
            capture_to_base64,
            shortcuts::get_shortcuts,
            shortcuts::check_shortcuts_registered,
            shortcuts::set_shortcuts,
            shortcuts::set_app_icon_visibility,
            shortcuts::set_always_on_top,
            activate::activate_license_api,
            activate::mask_license_key_cmd,
            activate::get_checkout_url,
            activate::secure_storage_save,
            activate::secure_storage_get,
            activate::secure_storage_remove,
            api::transcribe_audio,
            api::chat_stream,
            api::fetch_models,
            api::check_license_status,
            speaker::start_system_audio_capture,
            speaker::stop_system_audio_capture,
            speaker::check_system_audio_access,
            speaker::request_system_audio_access
        ])
        .setup(|app| {
            // Setup main window positioning
            window::setup_main_window(app).expect("Failed to setup main window");
            
            // Setup global shortcuts
            if let Err(e) = shortcuts::setup_global_shortcuts(app.handle()) {
                eprintln!("Failed to setup global shortcuts: {}", e);
            }
            
            Ok(())
        });

    // Add macOS-specific permissions plugin
    #[cfg(target_os = "macos")]
    {
        builder = builder.plugin(tauri_plugin_macos_permissions::init());
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}