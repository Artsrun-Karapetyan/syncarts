use std::sync::Mutex;

use serde::Serialize;
use tauri_plugin_updater::Update;

pub struct PendingAppUpdate(pub Mutex<Option<Update>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateMetadata {
    pub version: String,
    pub current_version: String,
    pub body: Option<String>,
    pub date: Option<String>,
}
