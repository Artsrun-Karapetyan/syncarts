pub mod commands;
pub mod models;

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use tauri::webview::PageLoadEvent;

#[tauri::command]
fn show_main_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let main_window_shown = Arc::new(AtomicBool::new(false));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::make_request::make_request,
            commands::save_response_body::save_response_body,
            show_main_window
        ])
        .on_page_load({
            let main_window_shown = main_window_shown.clone();

            move |webview, payload| {
                if webview.label() != "main" || !matches!(payload.event(), PageLoadEvent::Finished)
                {
                    return;
                }

                if main_window_shown.swap(true, Ordering::SeqCst) {
                    return;
                }

                let window = webview.window();
                let _ = window.show();
                let _ = window.set_focus();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
