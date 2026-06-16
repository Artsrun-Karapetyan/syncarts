#![allow(dead_code)]

use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use syncarts_lib::models::{BodyPayload, HttpRequest};

pub fn temp_file_path(name: &str) -> PathBuf {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    std::env::temp_dir().join(format!(
        "syncarts-test-{}-{}-{}",
        std::process::id(),
        timestamp,
        name
    ))
}

pub fn request(method: &str, url: &str, body: BodyPayload) -> HttpRequest {
    HttpRequest {
        url: url.to_string(),
        method: method.to_string(),
        headers: Default::default(),
        body,
    }
}
