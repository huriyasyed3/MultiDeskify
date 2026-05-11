use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct AppPayload {
    pub id: String,
    pub url: String,
    pub label: String,
}

// ─────────────────────────────────────────────
// GET CENTRAL AREA BOUNDS
// ─────────────────────────────────────────────
fn get_bounds(
    main: &tauri::WebviewWindow,
    sidebar: f64,
    topbar: f64,
) -> Result<(f64, f64, f64, f64), String> {

    let scale      = main.scale_factor().map_err(|e| e.to_string())?;
    let outer_pos  = main.outer_position().map_err(|e| e.to_string())?;
    let outer_size = main.outer_size().map_err(|e| e.to_string())?;
    let inner_size = main.inner_size().map_err(|e| e.to_string())?;

    // Titlebar height
    let titlebar_h =
        (outer_size.height as i32 - inner_size.height as i32)
            .max(0) as f64;

    // FINAL CORRECT POSITION
    let x = (outer_pos.x as f64 / scale) + sidebar;

    let y =
        (outer_pos.y as f64 / scale)
        + (titlebar_h / scale)
        + topbar;

    let w = (inner_size.width as f64 / scale) - sidebar;

    let h = (inner_size.height as f64 / scale) - topbar;

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

    // Already exists
    if app.get_webview_window(&payload.label).is_some() {
        return Ok(());
    }

    let main = app
        .get_webview_window("main")
        .ok_or("main window not found")?;

    let (x, y, w, h) = get_bounds(&main, 68.0, 80.0)?;

    let parsed = payload.url
        .parse::<url::Url>()
        .map_err(|e| e.to_string())?;

    WebviewWindowBuilder::new(
        &app,
        &payload.label,
        WebviewUrl::External(parsed),
    )
    .position(-10000.0, -10000.0) // START OFFSCREEN
    .inner_size(1.0, 1.0)
    .decorations(false)
    .resizable(false)
    .skip_taskbar(true)
    .focused(false)
    .visible(true)
    .transparent(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ─────────────────────────────────────────────
// SHOW WEBVIEW
// NO HIDE/SHOW = NO BLINK
// ─────────────────────────────────────────────
#[tauri::command]
async fn show_app_webview(
    app: AppHandle,
    label: String,
    sidebar_width: Option<f64>,
    topbar_height: Option<f64>,
) -> Result<(), String> {

    let main = app
        .get_webview_window("main")
        .ok_or("main window not found")?;

    let sidebar = sidebar_width.unwrap_or(68.0);
    let topbar  = topbar_height.unwrap_or(80.0);

    let (x, y, w, h) =
        get_bounds(&main, sidebar, topbar)?;

    // ─────────────────────────────
    // MOVE ACTIVE WEBVIEW TO SCREEN
    // ─────────────────────────────
    if let Some(wv) = app.get_webview_window(&label) {

        let _ = wv.set_position(
            tauri::LogicalPosition::new(x, y)
        );

        let _ = wv.set_size(
            tauri::LogicalSize::new(w, h)
        );

        let _ = wv.set_focus();
    }

    // ─────────────────────────────
    // MOVE OTHERS OFFSCREEN
    // ─────────────────────────────
    for (lbl, wv) in app.webview_windows() {

        if lbl != "main" && lbl != label {

            let _ = wv.set_position(
                tauri::LogicalPosition::new(-10000.0, -10000.0)
            );

            let _ = wv.set_size(
                tauri::LogicalSize::new(1.0, 1.0)
            );
        }
    }

    Ok(())
}

// ─────────────────────────────────────────────
// HIDE WEBVIEW
// MOVE OFFSCREEN INSTEAD OF hide()
// ─────────────────────────────────────────────
#[tauri::command]
async fn hide_app_webview(
    app: AppHandle,
    label: String,
) -> Result<(), String> {

    if let Some(wv) = app.get_webview_window(&label) {

        let _ = wv.set_position(
            tauri::LogicalPosition::new(-10000.0, -10000.0)
        );

        let _ = wv.set_size(
            tauri::LogicalSize::new(1.0, 1.0)
        );
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
        let _ = wv.close();
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

        let _ = wv.eval(
            "window.location.reload()"
        );
    }

    Ok(())
}

// ─────────────────────────────────────────────
// SYNC POSITION
// ─────────────────────────────────────────────
#[tauri::command]
async fn sync_webview_position(
    app: AppHandle,
    label: String,
    sidebar_width: Option<f64>,
    topbar_height: Option<f64>,
) -> Result<(), String> {

    let main = app
        .get_webview_window("main")
        .ok_or("main window not found")?;

    let sidebar = sidebar_width.unwrap_or(68.0);
    let topbar  = topbar_height.unwrap_or(80.0);

    let (x, y, w, h) =
        get_bounds(&main, sidebar, topbar)?;

    if let Some(wv) = app.get_webview_window(&label) {

        let pos = wv.outer_position();

        // Only sync if visible onscreen
        if let Ok(pos) = pos {

            if pos.x > -5000 {

                let _ = wv.set_position(
                    tauri::LogicalPosition::new(x, y)
                );

                let _ = wv.set_size(
                    tauri::LogicalSize::new(w, h)
                );
            }
        }
    }

    Ok(())
}

// ─────────────────────────────────────────────
// APP ENTRY
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

        .on_window_event(|window, event| {

            if window.label() != "main" {
                return;
            }

            let app = window.app_handle().clone();

            match event {

                // CLOSE ALL WEBVIEWS
                tauri::WindowEvent::CloseRequested { .. }
                | tauri::WindowEvent::Destroyed => {

                    for (lbl, wv) in app.webview_windows() {

                        if lbl != "main" {
                            let _ = wv.close();
                        }
                    }
                }

                // RESIZE / MOVE
                tauri::WindowEvent::Moved(_)
                | tauri::WindowEvent::Resized(_) => {

                    for (lbl, wv) in app.webview_windows() {

                        if lbl == "main" {
                            continue;
                        }

                        if let Ok(pos) = wv.outer_position() {

                            // Skip offscreen webviews
                            if pos.x < -5000 {
                                continue;
                            }

                            if let Some(main) =
                                app.get_webview_window("main")
                            {
                                if let Ok((x, y, w, h)) =
                                    get_bounds(&main, 68.0, 80.0)
                                {
                                    let _ = wv.set_position(
                                        tauri::LogicalPosition::new(x, y)
                                    );

                                    let _ = wv.set_size(
                                        tauri::LogicalSize::new(w, h)
                                    );
                                }
                            }
                        }
                    }
                }

                _ => {}
            }
        })

        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}