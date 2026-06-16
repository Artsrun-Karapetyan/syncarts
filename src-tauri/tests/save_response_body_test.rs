mod support;

use std::fs;

use syncarts_lib::commands::save_response_body;

use support::temp_file_path;

#[test]
fn writes_plain_text() {
    let path = temp_file_path("plain-response.txt");

    save_response_body(path.to_string_lossy().to_string(), "hello".to_string()).unwrap();

    assert_eq!(fs::read_to_string(&path).unwrap(), "hello");
    let _ = fs::remove_file(path);
}

#[test]
fn writes_empty_body() {
    let path = temp_file_path("empty-response.txt");

    save_response_body(path.to_string_lossy().to_string(), String::new()).unwrap();

    assert_eq!(fs::read(&path).unwrap(), b"");
    let _ = fs::remove_file(path);
}

#[test]
fn overwrites_existing_file() {
    let path = temp_file_path("overwrite-response.txt");
    fs::write(&path, "old").unwrap();

    save_response_body(path.to_string_lossy().to_string(), "new".to_string()).unwrap();

    assert_eq!(fs::read_to_string(&path).unwrap(), "new");
    let _ = fs::remove_file(path);
}

#[test]
fn decodes_text_data_url() {
    let path = temp_file_path("data-url-response.txt");

    save_response_body(
        path.to_string_lossy().to_string(),
        "data:text/plain;base64,aGVsbG8=".to_string(),
    )
    .unwrap();

    assert_eq!(fs::read(&path).unwrap(), b"hello");
    let _ = fs::remove_file(path);
}

#[test]
fn writes_binary_data_url_bytes() {
    let path = temp_file_path("binary-response.bin");

    save_response_body(
        path.to_string_lossy().to_string(),
        "data:application/octet-stream;base64,AAEC".to_string(),
    )
    .unwrap();

    assert_eq!(fs::read(&path).unwrap(), vec![0, 1, 2]);
    let _ = fs::remove_file(path);
}

#[test]
fn rejects_invalid_data_url() {
    let path = temp_file_path("invalid-data-url-response.txt");

    let result = save_response_body(
        path.to_string_lossy().to_string(),
        "data:text/plain;base64,%%%".to_string(),
    );

    assert!(result.is_err());
    assert!(!path.exists());
}

#[test]
fn rejects_data_url_without_payload_separator() {
    let path = temp_file_path("missing-comma-response.txt");

    let result = save_response_body(
        path.to_string_lossy().to_string(),
        "data:text/plain;base64".to_string(),
    );

    assert!(result.is_err());
    assert!(!path.exists());
}

#[test]
fn returns_error_when_target_parent_is_missing() {
    let path = temp_file_path("missing-parent").join("response.txt");

    let result = save_response_body(path.to_string_lossy().to_string(), "hello".to_string());

    assert!(result.is_err());
}
