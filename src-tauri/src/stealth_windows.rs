//! Windows Stealth Mode Implementation
//!
//! This module provides functionality to make the Pluely window "invisible" to
//! focus/blur detection on Windows by:
//! 1. Subclassing the window to intercept and block activation messages
//! 2. Using ShowWindow with SW_SHOWNOACTIVATE to show without taking focus
//! 3. Using rdev::grab for global keyboard capture that CONSUMES events
//!
//! This mirrors the NSPanel behavior on macOS.

use std::sync::atomic::{AtomicBool, AtomicIsize, Ordering};
use std::sync::Arc;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, POINT, RECT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    CallWindowProcW, DefWindowProcW, GetCursorPos, GetWindowLongPtrW, GetWindowLongW,
    GetWindowRect, SetWindowLongPtrW, SetWindowLongW, SetWindowPos, ShowWindow,
    GWL_EXSTYLE, GWLP_WNDPROC, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
    SW_HIDE, SW_SHOWNOACTIVATE, WNDPROC, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
};

// Window messages we need to intercept
const WM_ACTIVATE: u32 = 0x0006;
const WM_MOUSEACTIVATE: u32 = 0x0021;
const WM_NCACTIVATE: u32 = 0x0086;
const WM_SETFOCUS: u32 = 0x0007;

// Return values for WM_MOUSEACTIVATE
const MA_NOACTIVATE: isize = 3;

// Store the original window procedure
static ORIGINAL_WNDPROC: AtomicIsize = AtomicIsize::new(0);
static STEALTH_ENABLED: AtomicBool = AtomicBool::new(false);

/// Track modifier key states for detecting shortcuts
struct ModifierState {
    ctrl: AtomicBool,
    alt: AtomicBool,
    shift: AtomicBool,
}

impl Default for ModifierState {
    fn default() -> Self {
        Self {
            ctrl: AtomicBool::new(false),
            alt: AtomicBool::new(false),
            shift: AtomicBool::new(false),
        }
    }
}

/// State for stealth input capture mode
pub struct StealthInputState {
    /// Whether stealth input capture is currently active
    pub is_capturing: Arc<AtomicBool>,
    /// Whether the user has clicked inside the Pluely window (mouse-based activation)
    pub mouse_inside: Arc<AtomicBool>,
    /// The HWND of the main window for click detection
    pub main_hwnd: Mutex<Option<isize>>,
    /// Buffer for accumulated input (for potential use)
    pub input_buffer: Mutex<String>,
}

impl Default for StealthInputState {
    fn default() -> Self {
        Self {
            is_capturing: Arc::new(AtomicBool::new(false)),
            mouse_inside: Arc::new(AtomicBool::new(true)),
            main_hwnd: Mutex::new(None),
            input_buffer: Mutex::new(String::new()),
        }
    }
}

/// Custom window procedure that intercepts activation messages
/// Only blocks activation when stealth mode is enabled
unsafe extern "system" fn stealth_wndproc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    // Only block activation when stealth mode is enabled
    if STEALTH_ENABLED.load(Ordering::Relaxed) {
        match msg {
            WM_MOUSEACTIVATE => {
                // Prevent activation when clicking on the window
                return LRESULT(MA_NOACTIVATE);
            }
            WM_ACTIVATE => {
                // Block activation messages
                // wparam low word: 0 = WA_INACTIVE, 1 = WA_ACTIVE, 2 = WA_CLICKACTIVE
                let activation_state = (wparam.0 & 0xFFFF) as u32;
                if activation_state != 0 {
                    // Someone is trying to activate us - block it
                    return LRESULT(0);
                }
            }
            WM_NCACTIVATE => {
                // Return FALSE to prevent the window from being visually activated
                // But we need to handle this carefully to not break rendering
                // Only block if we're being activated (wparam != 0)
                if wparam.0 != 0 {
                    return LRESULT(0);
                }
            }
            WM_SETFOCUS => {
                // Prevent focus from being set
                return LRESULT(0);
            }
            _ => {}
        }
    }

    // Call the original window procedure for all other messages
    let original = ORIGINAL_WNDPROC.load(Ordering::Relaxed);
    if original != 0 {
        let original_proc: WNDPROC = std::mem::transmute(original);
        CallWindowProcW(original_proc, hwnd, msg, wparam, lparam)
    } else {
        DefWindowProcW(hwnd, msg, wparam, lparam)
    }
}

/// Set up the stealth window by:
/// 1. Applying WS_EX_NOACTIVATE and WS_EX_TOOLWINDOW styles
/// 2. Subclassing the window to intercept activation messages
pub fn setup_noactivate_window<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<(), Box<dyn std::error::Error>> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let hwnd = window.hwnd().map_err(|e| format!("Failed to get HWND: {}", e))?;
    let hwnd_value = hwnd.0 as isize;

    // Store the HWND for later use
    if let Some(state) = app.try_state::<StealthInputState>() {
        if let Ok(mut main_hwnd) = state.main_hwnd.lock() {
            *main_hwnd = Some(hwnd_value);
        }
    }

    unsafe {
        let hwnd = HWND(hwnd.0 as *mut _);

        // Get current extended style
        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);

        // Add WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW | WS_EX_TOPMOST
        // - NOACTIVATE: prevents activation on click
        // - TOOLWINDOW: different activation behavior, no taskbar button
        // - TOPMOST: keeps window on top (we'll manage this separately)
        let new_style = ex_style
            | WS_EX_NOACTIVATE.0 as i32
            | WS_EX_TOOLWINDOW.0 as i32;

        SetWindowLongW(hwnd, GWL_EXSTYLE, new_style);

        // Subclass the window to intercept activation messages
        let original = GetWindowLongPtrW(hwnd, GWLP_WNDPROC);
        ORIGINAL_WNDPROC.store(original, Ordering::Relaxed);

        SetWindowLongPtrW(hwnd, GWLP_WNDPROC, stealth_wndproc as isize);

        eprintln!("[stealth] Window subclassed and styles applied");
    }

    Ok(())
}

/// Show the window without activating it or stealing focus
pub fn show_window_stealth(hwnd_value: isize) {
    unsafe {
        let hwnd = HWND(hwnd_value as *mut _);

        // Use SW_SHOWNOACTIVATE to show without activating
        let _ = ShowWindow(hwnd, SW_SHOWNOACTIVATE);

        // Also use SetWindowPos with SWP_NOACTIVATE to ensure no activation
        let _ = SetWindowPos(
            hwnd,
            HWND_TOPMOST,
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
        );
    }
}

/// Hide the window
pub fn hide_window_stealth(hwnd_value: isize) {
    unsafe {
        let hwnd = HWND(hwnd_value as *mut _);
        let _ = ShowWindow(hwnd, SW_HIDE);
    }
}

/// Check if a point is inside the Pluely window
fn is_point_in_pluely_window(hwnd_value: isize) -> bool {
    unsafe {
        let mut cursor_pos = POINT::default();
        if GetCursorPos(&mut cursor_pos).is_err() {
            return false;
        }

        let hwnd = HWND(hwnd_value as *mut _);
        let mut window_rect = RECT::default();
        if GetWindowRect(hwnd, &mut window_rect).is_err() {
            return false;
        }

        cursor_pos.x >= window_rect.left
            && cursor_pos.x <= window_rect.right
            && cursor_pos.y >= window_rect.top
            && cursor_pos.y <= window_rect.bottom
    }
}

/// Start the global keyboard grabber using rdev::grab.
pub fn start_keyboard_listener<R: Runtime + 'static>(
    app: AppHandle<R>,
) -> Result<(), Box<dyn std::error::Error>> {
    use rdev::{grab, Button, Event, EventType, Key};

    let (is_capturing, mouse_inside, main_hwnd_value) = {
        let state = app
            .try_state::<StealthInputState>()
            .ok_or("StealthInputState not initialized")?;
        let hwnd = state.main_hwnd.lock().ok().and_then(|h| *h);
        (state.is_capturing.clone(), state.mouse_inside.clone(), hwnd)
    };

    let modifiers = Arc::new(ModifierState::default());
    let modifiers_clone = modifiers.clone();

    std::thread::spawn(move || {
        eprintln!("[stealth] Starting global keyboard grabber");

        let callback = move |event: Event| -> Option<Event> {
            let is_active = is_capturing.load(Ordering::Relaxed);
            let is_mouse_inside = mouse_inside.load(Ordering::Relaxed);

            // Handle mouse button events to detect clicks inside/outside Pluely
            match event.event_type {
                EventType::ButtonPress(Button::Left) | EventType::ButtonPress(Button::Right) => {
                    if let Some(hwnd) = main_hwnd_value {
                        let inside = is_point_in_pluely_window(hwnd);
                        mouse_inside.store(inside, Ordering::Relaxed);
                    }
                    return Some(event);
                }
                _ => {}
            }

            // If stealth mode is not active OR mouse is outside Pluely, pass through
            if !is_active || !is_mouse_inside {
                match event.event_type {
                    EventType::KeyPress(key) => match key {
                        Key::ControlLeft | Key::ControlRight => modifiers_clone.ctrl.store(true, Ordering::Relaxed),
                        Key::Alt | Key::AltGr => modifiers_clone.alt.store(true, Ordering::Relaxed),
                        Key::ShiftLeft | Key::ShiftRight => modifiers_clone.shift.store(true, Ordering::Relaxed),
                        _ => {}
                    },
                    EventType::KeyRelease(key) => match key {
                        Key::ControlLeft | Key::ControlRight => modifiers_clone.ctrl.store(false, Ordering::Relaxed),
                        Key::Alt | Key::AltGr => modifiers_clone.alt.store(false, Ordering::Relaxed),
                        Key::ShiftLeft | Key::ShiftRight => modifiers_clone.shift.store(false, Ordering::Relaxed),
                        _ => {}
                    },
                    _ => {}
                }
                return Some(event);
            }

            match event.event_type {
                EventType::KeyPress(key) => {
                    // Track modifier key presses
                    match key {
                        Key::ControlLeft | Key::ControlRight => {
                            modifiers_clone.ctrl.store(true, Ordering::Relaxed);
                            return Some(event);
                        }
                        Key::Alt | Key::AltGr => {
                            modifiers_clone.alt.store(true, Ordering::Relaxed);
                            return Some(event);
                        }
                        Key::ShiftLeft | Key::ShiftRight => {
                            modifiers_clone.shift.store(true, Ordering::Relaxed);
                            return Some(event);
                        }
                        _ => {}
                    }

                    let ctrl_held = modifiers_clone.ctrl.load(Ordering::Relaxed);
                    let alt_held = modifiers_clone.alt.load(Ordering::Relaxed);

                    if ctrl_held || alt_held {
                        return Some(event);
                    }

                    // Safety keys - always pass through
                    match key {
                        Key::Escape => {
                            emit_stealth_event(&app, "stealth-key-escape", ());
                            return Some(event);
                        }
                        Key::MetaLeft | Key::MetaRight => return Some(event),
                        Key::F1 | Key::F2 | Key::F3 | Key::F4 | Key::F5 | Key::F6 |
                        Key::F7 | Key::F8 | Key::F9 | Key::F10 | Key::F11 | Key::F12 => {
                            return Some(event);
                        }
                        _ => {}
                    }

                    // Keys that Pluely consumes
                    match key {
                        Key::Return => {
                            emit_stealth_event(&app, "stealth-key-enter", ());
                            return None;
                        }
                        Key::Backspace => {
                            emit_stealth_event(&app, "stealth-key-backspace", ());
                            return None;
                        }
                        Key::Tab => {
                            emit_stealth_event(&app, "stealth-key-tab", ());
                            return None;
                        }
                        Key::Space => {
                            emit_stealth_event(&app, "stealth-key-input", " ".to_string());
                            return None;
                        }
                        Key::UpArrow => {
                            emit_stealth_event(&app, "stealth-key-arrow", "up".to_string());
                            return None;
                        }
                        Key::DownArrow => {
                            emit_stealth_event(&app, "stealth-key-arrow", "down".to_string());
                            return None;
                        }
                        Key::LeftArrow => {
                            emit_stealth_event(&app, "stealth-key-arrow", "left".to_string());
                            return None;
                        }
                        Key::RightArrow => {
                            emit_stealth_event(&app, "stealth-key-arrow", "right".to_string());
                            return None;
                        }
                        _ => {
                            if let Some(name) = &event.name {
                                if !name.is_empty() {
                                    if let Some(c) = name.chars().next() {
                                        if !c.is_control() {
                                            emit_stealth_event(&app, "stealth-key-input", name.clone());
                                            return None;
                                        }
                                    }
                                }
                            }
                            return Some(event);
                        }
                    }
                }
                EventType::KeyRelease(key) => {
                    match key {
                        Key::ControlLeft | Key::ControlRight => modifiers_clone.ctrl.store(false, Ordering::Relaxed),
                        Key::Alt | Key::AltGr => modifiers_clone.alt.store(false, Ordering::Relaxed),
                        Key::ShiftLeft | Key::ShiftRight => modifiers_clone.shift.store(false, Ordering::Relaxed),
                        _ => {}
                    }
                    return Some(event);
                }
                _ => return Some(event),
            }
        };

        if let Err(e) = grab(callback) {
            eprintln!("[stealth] Error in keyboard grabber: {:?}", e);
        }
    });

    Ok(())
}

/// Helper function to emit stealth events to the frontend
fn emit_stealth_event<R: Runtime, T: serde::Serialize + Clone>(
    app: &AppHandle<R>,
    event_name: &str,
    payload: T,
) {
    if let Some(window) = app.get_webview_window("main") {
        if let Err(e) = window.emit(event_name, payload) {
            eprintln!("[stealth] Failed to emit {}: {}", event_name, e);
        }
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Enable or disable stealth input capture mode.
#[tauri::command]
pub fn enable_stealth_input<R: Runtime>(app: AppHandle<R>, enabled: bool) -> Result<(), String> {
    let state = app
        .try_state::<StealthInputState>()
        .ok_or("StealthInputState not initialized")?;

    state.is_capturing.store(enabled, Ordering::Relaxed);

    // Also enable/disable the window procedure blocking
    STEALTH_ENABLED.store(enabled, Ordering::Relaxed);

    if enabled {
        state.mouse_inside.store(true, Ordering::Relaxed);
    }

    if let Ok(mut buffer) = state.input_buffer.lock() {
        buffer.clear();
    }

    eprintln!("[stealth] Stealth mode: {}", if enabled { "enabled" } else { "disabled" });
    Ok(())
}

/// Show the Pluely window without stealing focus (stealth show)
#[tauri::command]
pub fn stealth_show_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let state = app
        .try_state::<StealthInputState>()
        .ok_or("StealthInputState not initialized")?;

    let hwnd = state
        .main_hwnd
        .lock()
        .map_err(|e| format!("Failed to lock: {}", e))?
        .ok_or("HWND not set")?;

    show_window_stealth(hwnd);
    Ok(())
}

/// Hide the Pluely window
#[tauri::command]
pub fn stealth_hide_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let state = app
        .try_state::<StealthInputState>()
        .ok_or("StealthInputState not initialized")?;

    let hwnd = state
        .main_hwnd
        .lock()
        .map_err(|e| format!("Failed to lock: {}", e))?
        .ok_or("HWND not set")?;

    hide_window_stealth(hwnd);
    Ok(())
}

/// Check if stealth input capture is currently active.
#[tauri::command]
pub fn is_stealth_input_active<R: Runtime>(app: AppHandle<R>) -> Result<bool, String> {
    let state = app
        .try_state::<StealthInputState>()
        .ok_or("StealthInputState not initialized")?;

    Ok(state.is_capturing.load(Ordering::Relaxed))
}

/// Get the current input buffer contents.
#[tauri::command]
pub fn get_stealth_input_buffer<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    let state = app
        .try_state::<StealthInputState>()
        .ok_or("StealthInputState not initialized")?;

    let buffer = state
        .input_buffer
        .lock()
        .map_err(|e| format!("Failed to lock buffer: {}", e))?;

    Ok(buffer.clone())
}

/// Clear the input buffer.
#[tauri::command]
pub fn clear_stealth_input_buffer<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let state = app
        .try_state::<StealthInputState>()
        .ok_or("StealthInputState not initialized")?;

    let mut buffer = state
        .input_buffer
        .lock()
        .map_err(|e| format!("Failed to lock buffer: {}", e))?;

    buffer.clear();
    Ok(())
}
