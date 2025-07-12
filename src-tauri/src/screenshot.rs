use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use screenshots::Screen;
use std::io::Cursor;
use std::time::Duration;
use tauri::{Emitter, Manager};
use tokio::time::sleep;

#[tauri::command]
pub async fn take_screenshot(app: tauri::AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window("main")
        .ok_or("Could not find main window")?;
    let screenshot_window = app
        .get_webview_window("screenshot")
        .ok_or("Could not find screenshot window")?;
    if main_window.is_visible().map_err(|e| e.to_string())? {
        main_window.hide().map_err(|e| e.to_string())?;
        sleep(Duration::from_millis(200)).await;
    }

    let screens = Screen::all().map_err(|e| e.to_string())?;
    let screen = screens[0];
    let image = screen.capture().map_err(|e| e.to_string())?;
    let (width, height) = (image.width(), image.height());

    // --- THIS IS THE CORRECT AND FINAL FIX ---
    // Use the .buffer() method provided by the screenshots::Image struct
    let buffer = image.as_raw();
    // Encode the image to PNG and then to a Base64 Data URL
    let mut encoded_image = Vec::new();
    let mut cursor = Cursor::new(&mut encoded_image);
    let encoder = PngEncoder::new(&mut cursor);

    encoder
        .write_image(buffer, width, height, image::ColorType::Rgba8.into())
        .map_err(|e| e.to_string())?;

    let base64_str = STANDARD.encode(&encoded_image);
    let data_url = format!("data:image/png;base64,{}", base64_str);

    screenshot_window.show().map_err(|e| e.to_string())?;
    screenshot_window.set_focus().map_err(|e| e.to_string())?;

    // // The event payload must be a string or a serializable struct
    screenshot_window
        .emit("screenshot_taken", data_url)
        .map_err(|e| e.to_string())?;

    Ok(())
}
