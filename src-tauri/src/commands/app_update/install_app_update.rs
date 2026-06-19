use tauri::{AppHandle, State};

use super::types::PendingAppUpdate;

#[tauri::command]
pub async fn install_app_update(
    app: AppHandle,
    pending_update: State<'_, PendingAppUpdate>,
) -> Result<(), String> {
    let update = pending_update
        .0
        .lock()
        .map_err(|_| "Failed to lock pending update".to_string())?
        .take()
        .ok_or_else(|| "There is no pending update".to_string())?;

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|error| error.to_string())?;

    app.restart();
}
