mod support;

use syncarts_lib::commands::make_request;
use syncarts_lib::models::{BodyPayload, FormDataItem};

use support::request;

#[test]
fn invalid_method_returns_clear_error() {
    let result = tauri::async_runtime::block_on(make_request(request(
        "TRACE",
        "http://127.0.0.1",
        BodyPayload::None,
    )));

    assert_eq!(result.unwrap_err(), "Invalid HTTP method");
}

#[test]
fn method_with_whitespace_returns_clear_error() {
    let result = tauri::async_runtime::block_on(make_request(request(
        " GET ",
        "http://127.0.0.1",
        BodyPayload::None,
    )));

    assert_eq!(result.unwrap_err(), "Invalid HTTP method");
}

#[test]
fn invalid_url_returns_builder_error() {
    let result = tauri::async_runtime::block_on(make_request(request(
        "GET",
        "not a url",
        BodyPayload::None,
    )));

    assert!(result.unwrap_err().contains("builder error"));
}

#[test]
fn invalid_url_is_rejected_before_raw_body_send() {
    let result = tauri::async_runtime::block_on(make_request(request(
        "POST",
        "not a url",
        BodyPayload::Raw {
            content: "{\"ok\":true}".to_string(),
        },
    )));

    assert!(result.unwrap_err().contains("builder error"));
}

#[test]
fn invalid_url_is_rejected_before_form_urlencoded_send() {
    let result = tauri::async_runtime::block_on(make_request(request(
        "POST",
        "not a url",
        BodyPayload::FormUrlEncoded {
            items: vec![FormDataItem {
                key: "q".to_string(),
                value: Some("search".to_string()),
                item_type: Some("text".to_string()),
                files: None,
            }],
        },
    )));

    assert!(result.unwrap_err().contains("builder error"));
}
