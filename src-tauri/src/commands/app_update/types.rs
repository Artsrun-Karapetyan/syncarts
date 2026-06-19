use std::sync::Mutex;

use serde::Serialize;
use tauri_plugin_updater::Update;

pub const UPDATER_ENDPOINT: Option<&str> = option_env!("SYNCARTS_UPDATER_ENDPOINT");
pub const UPDATER_PUBKEY: Option<&str> = option_env!("SYNCARTS_UPDATER_PUBKEY");

pub fn is_app_update_configured() -> bool {
    UPDATER_ENDPOINT.is_some() && UPDATER_PUBKEY.is_some()
}

pub struct PendingAppUpdate(pub Mutex<Option<Update>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateMetadata {
    pub version: String,
    pub current_version: String,
    pub body: Option<String>,
    pub date: Option<String>,
}
