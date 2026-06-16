use crate::commands::headers::build_headers;
use crate::commands::method::parse_method;
use crate::models::{BodyPayload, HttpRequest, HttpResponse};
use std::time::Instant;

#[tauri::command]
pub async fn make_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();
    let method = parse_method(&request.method)?;

    let is_auto_content_type = matches!(
        request.body,
        BodyPayload::FormData { .. } | BodyPayload::FormUrlEncoded { .. }
    );
    let headers = build_headers(request.headers, is_auto_content_type);

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
                                    .and_then(|name| name.to_str())
                                    .unwrap_or("file")
                                    .to_string();
                                let part = reqwest::multipart::Part::bytes(file_bytes)
                                    .file_name(file_name);
                                form = form.part(item.key.clone(), part);
                            }
                        }
                    }
                } else if let Some(value) = item.value {
                    form = form.text(item.key, value);
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
    let response = req_builder
        .send()
        .await
        .map_err(|error| error.to_string())?;
    let time_ms = start.elapsed().as_millis() as u64;

    let status = response.status().as_u16();
    let status_text = response.status().to_string();

    let mut resp_headers = std::collections::HashMap::new();
    let mut content_type_header = String::new();
    for (key, value) in response.headers() {
        if let Ok(value) = value.to_str() {
            resp_headers.insert(key.to_string(), value.to_string());
            if key == reqwest::header::CONTENT_TYPE {
                content_type_header = value.to_string();
            }
        }
    }

    let is_binary = content_type_header.starts_with("image/")
        || content_type_header.starts_with("application/pdf");

    let body = if is_binary {
        use base64::{engine::general_purpose, Engine as _};
        match response.bytes().await {
            Ok(bytes) => format!(
                "data:{};base64,{}",
                content_type_header,
                general_purpose::STANDARD.encode(bytes)
            ),
            Err(error) => format!("Error reading binary response: {}", error),
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
