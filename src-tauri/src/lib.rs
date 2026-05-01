use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct AppPayload {
    pub id: String,
    pub url: String,
    pub label: String,
}

// ─────────────────────────────────────────────
// CORE LAYOUT FIX (IMPORTANT PART)
// ─────────────────────────────────────────────
fn get_bounds(main: &tauri::WebviewWindow) -> Result<(f64, f64, f64, f64), String> {
    let scale      = main.scale_factor().map_err(|e| e.to_string())?;
    let outer_pos  = main.outer_position().map_err(|e| e.to_string())?;
    let outer_size = main.outer_size().map_err(|e| e.to_string())?;
    let inner_size = main.inner_size().map_err(|e| e.to_string())?;

    // Title bar height in physical pixels
    let titlebar_h = (outer_size.height as i32 - inner_size.height as i32).max(0) as f64;

    // CSS se confirmed values (logical pixels):
    // sidebar = 68px, topbar+tabs = 80px
    let sidebar_px: f64 = 68.0 * scale;
    let topbar_px:  f64 = 80.0 * scale;

    // Screen position in logical pixels
    let x = (outer_pos.x as f64 + sidebar_px) / scale;
    let y = (outer_pos.y as f64 + titlebar_h) / scale + 80.0;

    // Size in logical pixels
    let w = (inner_size.width  as f64 / scale) - 68.0;
    let h = (inner_size.height as f64 / scale) - 80.0;

    Ok((x, y, w, h))
}
// ─────────────────────────────────────────────
// CREATE WEBVIEW
// ─────────────────────────────────────────────
#[tauri::command]
async fn create_app_webview(
    app: AppHandle,
    payload: AppPayload,
) -> Result<(), String> {
    if app.get_webview_window(&payload.label).is_some() {
        return Ok(());
    }

    let main = app
        .get_webview_window("main")
        .ok_or("main window not found")?;

    let (x, y, w, h) = get_bounds(&main)?;

    let parsed = payload
        .url
        .parse::<url::Url>()
        .map_err(|e| e.to_string())?;

    WebviewWindowBuilder::new(
        &app,
        &payload.label,
        WebviewUrl::External(parsed),
    )
    .position(x, y)
    .inner_size(w, h)
    .decorations(false)
    .resizable(false)
    .skip_taskbar(true)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ─────────────────────────────────────────────
// SHOW WEBVIEW
// ─────────────────────────────────────────────
#[tauri::command]
async fn show_app_webview(
    app: AppHandle,
    label: String,
) -> Result<(), String> {
    if let Some(wv) = app.get_webview_window(&label) {
        wv.show().map_err(|e| e.to_string())?;
        wv.set_focus().ok();
    }
    Ok(())
}

// ─────────────────────────────────────────────
// HIDE WEBVIEW
// ─────────────────────────────────────────────
#[tauri::command]
async fn hide_app_webview(
    app: AppHandle,
    label: String,
) -> Result<(), String> {
    if let Some(wv) = app.get_webview_window(&label) {
        wv.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─────────────────────────────────────────────
// DESTROY WEBVIEW
// ─────────────────────────────────────────────
#[tauri::command]
async fn destroy_app_webview(
    app: AppHandle,
    label: String,
) -> Result<(), String> {
    if let Some(wv) = app.get_webview_window(&label) {
        wv.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─────────────────────────────────────────────
// RELOAD WEBVIEW
// ─────────────────────────────────────────────
#[tauri::command]
async fn reload_app_webview(
    app: AppHandle,
    label: String,
) -> Result<(), String> {
    if let Some(wv) = app.get_webview_window(&label) {
        wv.eval("window.location.reload()")
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─────────────────────────────────────────────
// SYNC POSITION (SAFE + STABLE)
// ─────────────────────────────────────────────
#[tauri::command]
async fn sync_webview_position(
    app: AppHandle,
    label: String,
) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or("main window not found")?;

    let (x, y, w, h) = get_bounds(&main)?;

    if let Some(wv) = app.get_webview_window(&label) {
        wv.set_position(tauri::LogicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;

        wv.set_size(tauri::LogicalSize::new(w, h))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ─────────────────────────────────────────────
// RUN APP
// ─────────────────────────────────────────────
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_app_webview,
            show_app_webview,
            hide_app_webview,
            destroy_app_webview,
            reload_app_webview,
            sync_webview_position,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}