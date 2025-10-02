use tauri::{Manager, App, WebviewWindow, Runtime};

// The offset from the top of the screen to the window
#[cfg(target_os = "linux")]
const TOP_OFFSET: i32 = 60; // avoid GNOME/KDE top bars
#[cfg(not(target_os = "linux"))]
const TOP_OFFSET: i32 = 0;

/// Sets up the main window with custom positioning
pub fn setup_main_window(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Try different possible window labels
    let window = app.get_webview_window("main")
        .or_else(|| app.get_webview_window("pluely"))
        .or_else(|| {
            // Get the first window if specific labels don't work
            app.webview_windows().values().next().cloned()
        })
        .ok_or("No window found")?;
    
    position_window_top_center(&window, TOP_OFFSET)?;

    // Ensure it's visible and focused on Linux (can start behind panels)
    #[cfg(target_os = "linux")]
    {
        let _ = window.show();
        let _ = window.set_focus();
    }
    
    Ok(())
}

/// Positions a window at the top center of the screen with a specified Y offset
pub fn position_window_top_center<R: Runtime>(window: &WebviewWindow<R>, y_offset: i32) -> Result<(), Box<dyn std::error::Error>> {
    // Get the primary monitor
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;
        
        // Calculate center X position
        let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;
        
        // Set the window position
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: center_x,
            y: y_offset,
        }))?;
    }
    
    Ok(())
}


/// Position window at bottom-center with an offset from bottom
pub fn position_window_bottom_center<R: Runtime>(window: &WebviewWindow<R>, y_offset_from_bottom: i32) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;

        let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;
        let y = monitor_size.height as i32 - window_size.height as i32 - y_offset_from_bottom;
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: center_x, y }))?;
    }
    Ok(())
}

/// Position window at left-center with an offset from the left edge
pub fn position_window_left_center<R: Runtime>(window: &WebviewWindow<R>, x_offset: i32) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;

        let y = (monitor_size.height as i32 - window_size.height as i32) / 2;
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: x_offset, y }))?;
    }
    Ok(())
}

/// Position window at right-center with an offset from the right edge
pub fn position_window_right_center<R: Runtime>(window: &WebviewWindow<R>, x_offset: i32) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;

        let x = monitor_size.width as i32 - window_size.width as i32 - x_offset;
        let y = (monitor_size.height as i32 - window_size.height as i32) / 2;
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))?;
    }
    Ok(())
}