use tauri::{AppHandle, State};
use tauri_plugin_updater::UpdaterExt;

use super::types::{AppUpdateMetadata, PendingAppUpdate};

#[tauri::command]
pub async fn check_app_update(
    app: AppHandle,
    pending_update: State<'_, PendingAppUpdate>,
) -> Result<Option<AppUpdateMetadata>, String> {
    let update = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;

    let metadata = update.as_ref().map(|update| AppUpdateMetadata {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        body: update.body.clone(),
        date: update.date.as_ref().map(ToString::to_string),
    });

    *pending_update
        .0
        .lock()
        .map_err(|_| "Failed to lock pending update".to_string())? = update;

    Ok(metadata)
}
