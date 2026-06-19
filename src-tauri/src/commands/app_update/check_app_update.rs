use tauri::{AppHandle, State};
use tauri_plugin_updater::UpdaterExt;

use super::types::{AppUpdateMetadata, PendingAppUpdate, UPDATER_ENDPOINT, UPDATER_PUBKEY};

#[tauri::command]
pub async fn check_app_update(
    app: AppHandle,
    pending_update: State<'_, PendingAppUpdate>,
) -> Result<Option<AppUpdateMetadata>, String> {
    let endpoint =
        UPDATER_ENDPOINT.ok_or_else(|| "Updater endpoint is not configured".to_string())?;
    let pubkey =
        UPDATER_PUBKEY.ok_or_else(|| "Updater public key is not configured".to_string())?;
    let endpoint = url::Url::parse(endpoint).map_err(|error| error.to_string())?;

    let update = app
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(|error| error.to_string())?
        .pubkey(pubkey)
        .build()
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
