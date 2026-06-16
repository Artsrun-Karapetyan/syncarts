use crate::commands::data_url::decode_data_url;

#[tauri::command]
pub fn save_response_body(path: String, body: String) -> Result<(), String> {
    let bytes = if body.starts_with("data:") {
        decode_data_url(&body)?
    } else {
        body.into_bytes()
    };

    std::fs::write(path, bytes).map_err(|error| error.to_string())
}
