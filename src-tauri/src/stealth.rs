use std::sync::atomic::{AtomicBool, Ordering};
// use std::sync::{Arc, Mutex}; // Unused
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{LPARAM, LRESULT, WPARAM, HWND, POINT, RECT};
#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    VIRTUAL_KEY, VK_CONTROL, VK_LCONTROL, VK_LWIN, VK_MENU, VK_LMENU, VK_RMENU,
    VK_RCONTROL, VK_RWIN, VK_SHIFT, VK_LSHIFT, VK_RSHIFT,
    VK_LEFT, VK_RIGHT, VK_UP, VK_DOWN, VK_PRIOR, VK_NEXT, VK_HOME, VK_END,
};
#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::GetKeyState;
// use windows::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState; // Unused
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, SetWindowsHookExW, UnhookWindowsHookEx, KBDLLHOOKSTRUCT,
    WH_KEYBOARD_LL, WH_MOUSE_LL, WM_KEYDOWN, WM_LBUTTONDOWN,
    WM_SYSKEYDOWN, GetWindowRect, HHOOK, GetCursorPos
};

// Global hook handles (must be thread-safe)
#[cfg(target_os = "windows")]
static mut KEYBOARD_HOOK: HHOOK = HHOOK(0);
#[cfg(target_os = "windows")]
static mut MOUSE_HOOK: HHOOK = HHOOK(0);
#[cfg(target_os = "windows")]
static mut TARGET_HWND: HWND = HWND(0);

// Global state to communicate with hook procedures
#[cfg(target_os = "windows")]
static CAPTURE_ENABLED: AtomicBool = AtomicBool::new(false);
#[cfg(target_os = "windows")]
static mut CAPS_LOCK_STATE: bool = false;

// App handle for emitting events from hooks
// Note: This is a hack because hooks are C-style callbacks.
// We'll use a lazy_static or similar if we need complex state,
// but for now we might just emit to all windows or use a channel if possible.
// Actually, we can't easily pass the AppHandle to the hook proc.
// We might need a global channel sender.

use std::sync::mpsc::{channel, Sender};
use std::sync::OnceLock;

#[derive(Debug, Clone, serde::Serialize)]
struct StealthKeyEvent {
    key: String,
    code: u32,
    event_type: String, // "keydown", "keyup", "deactivate"
    caps_lock: bool,
    shift: bool,
    ctrl: bool,
    alt: bool,
    win: bool,
}

static EVENT_SENDER: OnceLock<Sender<StealthKeyEvent>> = OnceLock::new();

#[cfg(target_os = "windows")]
unsafe extern "system" fn keyboard_hook_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let kbd = *(lparam.0 as *const KBDLLHOOKSTRUCT);
        let vk_code = VIRTUAL_KEY(kbd.vkCode as u16);
        
        // Debug: Log navigation keys regardless of capture state
        let is_nav_debug = matches!(
            vk_code,
            VK_LEFT | VK_RIGHT | VK_UP | VK_DOWN |
            VK_PRIOR | VK_NEXT | VK_HOME | VK_END
        );
        if is_nav_debug {
             let captured = CAPTURE_ENABLED.load(Ordering::Relaxed);
             println!("Stealth Hook: Nav Key {:?} (Capture: {})", vk_code, captured);
        }

        if CAPTURE_ENABLED.load(Ordering::Relaxed) {
            let event_type = wparam.0 as u32;
        
        // Removed blocking println!
        
        let is_keydown = event_type == WM_KEYDOWN || event_type == WM_SYSKEYDOWN;
        
        if CAPTURE_ENABLED.load(Ordering::Relaxed) {
             // println!("Stealth Hook: Key {:?} Event {}", vk_code, event_type);
        }
        
        // Determine if we should block this key
        let mut should_block = false;
        let _key_name = String::new();

        // Check for modifiers (pass through)
        let is_modifier = matches!(
            vk_code,
            VK_SHIFT | VK_LSHIFT | VK_RSHIFT |
            VK_CONTROL | VK_LCONTROL | VK_RCONTROL |
            VK_MENU | VK_LMENU | VK_RMENU |
            VK_LWIN | VK_RWIN |
            windows::Win32::UI::Input::KeyboardAndMouse::VK_CAPITAL |
            windows::Win32::UI::Input::KeyboardAndMouse::VK_NUMLOCK |
            windows::Win32::UI::Input::KeyboardAndMouse::VK_SCROLL
        );

        let mut caps_lock_on = false;

        // Track Caps Lock State (Always check this, regardless of modifier status)
        unsafe {
            if vk_code == windows::Win32::UI::Input::KeyboardAndMouse::VK_CAPITAL && is_keydown {
                CAPS_LOCK_STATE = !CAPS_LOCK_STATE;
                println!("Stealth Hook: Caps Lock Toggled to {}", CAPS_LOCK_STATE);
            }
            caps_lock_on = CAPS_LOCK_STATE;
        }

        // Define modifiers in a wider scope
        let mut ctrl_down = false;
        let mut alt_down = false;
        let mut win_down = false;
        let mut shift_down = false;

        unsafe {
             ctrl_down = (GetKeyState(VK_CONTROL.0 as i32) & 0x8000u16 as i16) != 0 ||
                            (GetKeyState(VK_LCONTROL.0 as i32) & 0x8000u16 as i16) != 0 ||
                            (GetKeyState(VK_RCONTROL.0 as i32) & 0x8000u16 as i16) != 0;
            
             alt_down = (GetKeyState(VK_MENU.0 as i32) & 0x8000u16 as i16) != 0;
             win_down = (GetKeyState(VK_LWIN.0 as i32) & 0x8000u16 as i16) != 0 || 
                           (GetKeyState(VK_RWIN.0 as i32) & 0x8000u16 as i16) != 0;
             shift_down = (GetKeyState(VK_SHIFT.0 as i32) & 0x8000u16 as i16) != 0 ||
                             (GetKeyState(VK_LSHIFT.0 as i32) & 0x8000u16 as i16) != 0 ||
                             (GetKeyState(VK_RSHIFT.0 as i32) & 0x8000u16 as i16) != 0;
        }

        if !is_modifier {
            // Block standard keys if capturing
            // We want to block typing keys: A-Z, 0-9, Symbols, Space, Enter, Backspace, Tab
            // We might let F-keys pass?
            
            // Simple heuristic: Block everything that isn't a modifier or F-key?
            // Let's be aggressive for "stealth typing"
            should_block = true;
            
            unsafe {
                // If Alt or Win is down, pass through (System shortcuts)
                if alt_down || win_down {
                    should_block = false;
                }
                // If Ctrl is down
                else if ctrl_down {
                    // Check for Ctrl+V (Paste)
                    if vk_code.0 == 0x56 { // 'V' key
                         // We want to capture Paste
                         should_block = true;
                         // We will emit 'stealth-key-event' with 'V' and frontend will handle paste
                    } else {
                         // Other Ctrl shortcuts (Ctrl+C, Ctrl+S, etc) -> Pass through
                         should_block = false;
                    }
                }
            }
        }

        // Emit event
        if let Some(sender) = EVENT_SENDER.get() {
            let _ = sender.send(StealthKeyEvent {
                key: format!("{:?}", vk_code), // Rough approximation
                code: kbd.vkCode,
                event_type: if is_keydown { "keydown".into() } else { "keyup".into() },
                caps_lock: caps_lock_on,
                shift: shift_down,
                ctrl: ctrl_down,
                alt: alt_down,
                win: win_down,
            });
        } else {
            println!("Stealth Hook: EVENT_SENDER not set");
        }

        if should_block {
            return LRESULT(1); // Swallow event
        }
    }
    }
    CallNextHookEx(KEYBOARD_HOOK, code, wparam, lparam)
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn mouse_hook_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let msg = wparam.0 as u32;
        if msg == WM_LBUTTONDOWN {
            // Check if click is inside our window
            let mut point = POINT::default();
            let _ = GetCursorPos(&mut point);
            
            let mut rect = RECT::default();
            if TARGET_HWND.0 != 0 {
                let _ = GetWindowRect(TARGET_HWND, &mut rect);
                
                // Manual PtInRect check
                let inside = point.x >= rect.left && point.x < rect.right && 
                             point.y >= rect.top && point.y < rect.bottom;

                // Debug mouse click
                // println!("Stealth Mouse: Click at ({}, {}), Window Rect: {:?}, Inside: {}", point.x, point.y, rect, inside);

                if !inside {
                    // Clicked outside -> Disable capture
                    if CAPTURE_ENABLED.load(Ordering::Relaxed) {
                        CAPTURE_ENABLED.store(false, Ordering::Relaxed);
                        // Emit deactivate event
                         if let Some(sender) = EVENT_SENDER.get() {
                            let _ = sender.send(StealthKeyEvent {
                                key: "".into(),
                                code: 0,
                                event_type: "deactivate".into(),
                                caps_lock: false,
                                shift: false,
                                ctrl: false,
                                alt: false,
                                win: false,
                            });
                        }
                    }
                }
            }
        }
    }
    CallNextHookEx(MOUSE_HOOK, code, wparam, lparam)
}

pub struct StealthManager {
    #[cfg(target_os = "windows")]
    hook_thread: Option<std::thread::JoinHandle<()>>,
    #[cfg(target_os = "windows")]
    app_handle: AppHandle,
}

impl StealthManager {
    pub fn new(app: AppHandle) -> Self {
        let (tx, rx) = channel();
        EVENT_SENDER.set(tx).ok();

        // Spawn a thread to handle events from the hook and emit to Tauri
        let app_handle = app.clone();
        std::thread::spawn(move || {
            while let Ok(event) = rx.recv() {
                // println!("Stealth Thread: Emitting event {:?}", event.key); // Optional logging
                let _ = app_handle.emit("stealth-key-event", event);
            }
        });

        Self {
            #[cfg(target_os = "windows")]
            hook_thread: None,
            #[cfg(target_os = "windows")]
            app_handle: app.clone(), // Store handle for start()
        }
    }

    #[cfg(target_os = "windows")]
    pub fn start(&mut self) {
        let app_handle = self.app_handle.clone();
        
        // Hooks must be set on a thread with a message loop
        self.hook_thread = Some(std::thread::spawn(move || {
            unsafe {
                // Get HWND of main window - try multiple names
                let window = app_handle.get_webview_window("main")
                    .or_else(|| app_handle.get_webview_window("pluely"))
                    .or_else(|| app_handle.webview_windows().values().next().cloned());

                if let Some(window) = window {
                    if let Ok(hwnd) = window.hwnd() {
                        TARGET_HWND = HWND(hwnd.0 as _);
                        println!("StealthManager: Found target window HWND: {:?}", TARGET_HWND);
                    } else {
                        eprintln!("StealthManager: Failed to get HWND from window");
                    }
                } else {
                    eprintln!("StealthManager: No window found to attach hooks");
                }

                let instance = windows::Win32::System::LibraryLoader::GetModuleHandleW(None).unwrap();
                
                KEYBOARD_HOOK = SetWindowsHookExW(
                    WH_KEYBOARD_LL,
                    Some(keyboard_hook_proc),
                    instance,
                    0
                ).unwrap();

                MOUSE_HOOK = SetWindowsHookExW(
                    WH_MOUSE_LL,
                    Some(mouse_hook_proc),
                    instance,
                    0
                ).unwrap();

                // Initialize Caps Lock state
                CAPS_LOCK_STATE = (GetKeyState(windows::Win32::UI::Input::KeyboardAndMouse::VK_CAPITAL.0 as i32) & 0x0001u16 as i16) != 0;
                println!("StealthManager: Initial Caps Lock State: {}", CAPS_LOCK_STATE);

                // Message loop
                use windows::Win32::UI::WindowsAndMessaging::{GetMessageW, DispatchMessageW, TranslateMessage, MSG};
                let mut msg = MSG::default();
                while GetMessageW(&mut msg, None, 0, 0).as_bool() {
                    TranslateMessage(&msg);
                    DispatchMessageW(&msg);
                }
                
                UnhookWindowsHookEx(KEYBOARD_HOOK);
                UnhookWindowsHookEx(MOUSE_HOOK);
            }
        }));
    }
    
    #[cfg(not(target_os = "windows"))]
    pub fn start(&mut self) {}

    pub fn set_capture(&self, enabled: bool) {
        #[cfg(target_os = "windows")]
        CAPTURE_ENABLED.store(enabled, Ordering::Relaxed);
    }
}
