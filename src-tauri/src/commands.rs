use crate::models::{HttpRequest, HttpResponse};
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
    for (k, v) in request.headers {
        if let (Ok(name), Ok(value)) = (HeaderName::from_bytes(k.as_bytes()), HeaderValue::from_str(&v)) {
            headers.insert(name, value);
        }
    }

    let mut req_builder = client.request(method, &request.url).headers(headers);

    if let Some(body) = request.body {
        if !body.trim().is_empty() {
            req_builder = req_builder.body(body);
        }
    }

    let start = Instant::now();
    let response = req_builder.send().await.map_err(|e| e.to_string())?;
    let time_ms = start.elapsed().as_millis() as u64;

    let status = response.status().as_u16();
    let status_text = response.status().to_string();
    
    let mut resp_headers = std::collections::HashMap::new();
    for (k, v) in response.headers() {
        if let Ok(value) = v.to_str() {
            resp_headers.insert(k.to_string(), value.to_string());
        }
    }

    let body = response.text().await.unwrap_or_default();

    Ok(HttpResponse {
        status,
        status_text,
        headers: resp_headers,
        body,
        time_ms,
    })
}
