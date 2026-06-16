use crate::models::{BodyPayload, HttpRequest, HttpResponse};
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use std::time::Instant;

#[tauri::command]
pub async fn make_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();
    let method = match request.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        _ => return Err("Invalid HTTP method".into()),
    };

    let mut headers = HeaderMap::new();
    let is_auto_content_type = matches!(
        request.body,
        BodyPayload::FormData { .. } | BodyPayload::FormUrlEncoded { .. }
    );

    for (k, v) in request.headers {
        if let (Ok(name), Ok(value)) = (
            HeaderName::from_bytes(k.as_bytes()),
            HeaderValue::from_str(&v),
        ) {
            if is_auto_content_type && name == reqwest::header::CONTENT_TYPE {
                continue;
            }
            headers.insert(name, value);
        }
    }

    let mut req_builder = client.request(method, &request.url).headers(headers);

    match request.body {
        BodyPayload::None => {}
        BodyPayload::Raw { content } => {
            if !content.trim().is_empty() {
                req_builder = req_builder.body(content);
            }
        }
        BodyPayload::FormData { items } => {
            let mut form = reqwest::multipart::Form::new();
            for item in items {
                let is_file = item.item_type.as_deref() == Some("file");
                if is_file {
                    if let Some(files) = item.files {
                        for path_str in files {
                            if let Ok(file_bytes) = std::fs::read(&path_str) {
                                let file_name = std::path::Path::new(&path_str)
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("file")
                                    .to_string();
                                let part = reqwest::multipart::Part::bytes(file_bytes).file_name(file_name);
                                form = form.part(item.key.clone(), part);
                            }
                        }
                    }
                } else if let Some(val) = item.value {
                    form = form.text(item.key, val);
                } else {
                    form = form.text(item.key, "");
                }
            }
            req_builder = req_builder.multipart(form);
        }
        BodyPayload::FormUrlEncoded { items } => {
            let mut map = std::collections::HashMap::new();
            for item in items {
                map.insert(item.key, item.value.unwrap_or_default());
            }
            req_builder = req_builder.form(&map);
        }
    }

    let start = Instant::now();
    let response = req_builder.send().await.map_err(|e| e.to_string())?;
    let time_ms = start.elapsed().as_millis() as u64;

    let status = response.status().as_u16();
    let status_text = response.status().to_string();

    let mut resp_headers = std::collections::HashMap::new();
    let mut content_type_header = String::new();
    for (k, v) in response.headers() {
        if let Ok(value) = v.to_str() {
            resp_headers.insert(k.to_string(), value.to_string());
            if k == reqwest::header::CONTENT_TYPE {
                content_type_header = value.to_string();
            }
        }
    }

    let is_binary = content_type_header.starts_with("image/") || content_type_header.starts_with("application/pdf");

    let body = if is_binary {
        use base64::{Engine as _, engine::general_purpose};
        match response.bytes().await {
            Ok(bytes) => format!("data:{};base64,{}", content_type_header, general_purpose::STANDARD.encode(bytes)),
            Err(e) => format!("Error reading binary response: {}", e),
        }
    } else {
        response.text().await.unwrap_or_default()
    };

    Ok(HttpResponse {
        status,
        status_text,
        headers: resp_headers,
        body,
        time_ms,
    })
}

#[tauri::command]
pub fn save_response_body(path: String, body: String) -> Result<(), String> {
    let bytes = if body.starts_with("data:") {
        decode_data_url(&body)?
    } else {
        body.into_bytes()
    };

    std::fs::write(path, bytes).map_err(|error| error.to_string())
}

fn decode_data_url(value: &str) -> Result<Vec<u8>, String> {
    use base64::{engine::general_purpose, Engine as _};

    let (_, data) = value
        .split_once(',')
        .ok_or_else(|| "Invalid data URL response body".to_string())?;

    general_purpose::STANDARD
        .decode(data)
        .map_err(|error| error.to_string())
}
