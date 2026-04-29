use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct AppPayload {
    pub id: String,
    pub url: String,
    pub label: String,
}

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

    let pos   = main.inner_position().map_err(|e| e.to_string())?;
    let size  = main.inner_size().map_err(|e| e.to_string())?;
    let scale = main.scale_factor().map_err(|e| e.to_string())?;

    let sidebar_px = (68.0 * scale) as i32;
    let topbar_px  = (52.0 * scale) as i32;

    let x = (pos.x + sidebar_px) as f64 / scale;
    let y = (pos.y + topbar_px)  as f64 / scale;
    let w = (size.width  as i32 - sidebar_px) as f64 / scale;
    let h = (size.height as i32 - topbar_px)  as f64 / scale;

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

#[tauri::command]
async fn sync_webview_position(
    app: AppHandle,
    label: String,
) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or("main window not found")?;

    let pos   = main.inner_position().map_err(|e| e.to_string())?;
    let size  = main.inner_size().map_err(|e| e.to_string())?;
    let scale = main.scale_factor().map_err(|e| e.to_string())?;

    let sidebar_px = (68.0 * scale) as i32;
    let topbar_px  = (52.0 * scale) as i32;

    let x = (pos.x + sidebar_px) as f64 / scale;
    let y = (pos.y + topbar_px)  as f64 / scale;
    let w = (size.width  as i32 - sidebar_px) as f64 / scale;
    let h = (size.height as i32 - topbar_px)  as f64 / scale;

    if let Some(wv) = app.get_webview_window(&label) {
        wv.set_position(tauri::LogicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;

        wv.set_size(tauri::LogicalSize::new(w, h))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

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