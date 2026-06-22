pub mod commands;
pub mod models;

use std::collections::HashMap;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};

use tauri::webview::PageLoadEvent;

use crate::commands::app_update::PendingAppUpdate;

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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PendingAppUpdate(std::sync::Mutex::new(None)))
        .manage(crate::commands::fs_sync::FsWatcherState {
            watchers: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            commands::app_update::check_app_update::check_app_update,
            commands::app_update::install_app_update::install_app_update,
            commands::make_request::make_request,
            commands::save_response_body::save_response_body,
            commands::secrets::get_secret,
            commands::secrets::set_secret,
            commands::secrets::delete_secret,
            commands::fs_sync::read_local_workspace,
            commands::fs_sync::write_local_file,
            commands::fs_sync::delete_local_file,
            commands::fs_sync::delete_local_dir,
            commands::fs_sync::watch_local_workspace,
            commands::fs_sync::unwatch_local_workspace,
            commands::git::git_check_repo,
            commands::git::git_get_current_branch,
            commands::git::git_get_branches,
            commands::git::git_checkout_branch,
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
