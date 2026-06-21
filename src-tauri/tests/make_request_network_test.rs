use mockito::Server;
use std::collections::HashMap;
use syncarts_lib::commands::make_request::make_request;
use syncarts_lib::models::{BodyPayload, HttpRequest, FormDataItem};

#[tokio::test]
async fn test_make_request_raw_payload() {
    let mut server = Server::new_async().await;
    
    let mock = server.mock("POST", "/")
        .match_header("content-type", "application/json")
        .match_body("{\"test\":\"data\"}")
        .with_status(201)
        .with_header("content-type", "application/json")
        .with_body("{\"success\":true}")
        .create_async()
        .await;

    let mut headers = HashMap::new();
    headers.insert("Content-Type".to_string(), "application/json".to_string());

    let req = HttpRequest {
        url: server.url(),
        method: "POST".to_string(),
        headers,
        body: BodyPayload::Raw {
            content: "{\"test\":\"data\"}".to_string(),
        },
    };

    let response = make_request(req).await.unwrap();
    
    mock.assert_async().await;
    assert_eq!(response.status, 201);
    assert_eq!(response.body, "{\"success\":true}");
    assert!(response.time_ms > 0);
}

#[tokio::test]
async fn test_make_request_form_urlencoded() {
    let mut server = Server::new_async().await;
    
    let mock = server.mock("POST", "/")
        .match_header("content-type", "application/x-www-form-urlencoded")
        .match_body(mockito::Matcher::Regex("key1=value1".to_string()))
        .with_status(200)
        .with_body("ok")
        .create_async()
        .await;

    let req = HttpRequest {
        url: server.url(),
        method: "POST".to_string(),
        headers: HashMap::new(),
        body: BodyPayload::FormUrlEncoded {
            items: vec![
                FormDataItem {
                    key: "key1".to_string(),
                    value: Some("value1".to_string()),
                    item_type: Some("text".to_string()),
                    files: None,
                },
                FormDataItem {
                    key: "key2".to_string(),
                    value: Some("value2".to_string()),
                    item_type: Some("text".to_string()),
                    files: None,
                },
            ],
        },
    };

    let response = make_request(req).await.unwrap();
    
    mock.assert_async().await;
    assert_eq!(response.status, 200);
}

#[tokio::test]
async fn test_make_request_binary_response() {
    let mut server = Server::new_async().await;
    
    let binary_data = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]; // PNG signature
    
    let mock = server.mock("GET", "/")
        .with_status(200)
        .with_header("content-type", "image/png")
        .with_body(binary_data)
        .create_async()
        .await;

    let req = HttpRequest {
        url: server.url(),
        method: "GET".to_string(),
        headers: HashMap::new(),
        body: BodyPayload::None,
    };

    let response = make_request(req).await.unwrap();
    
    mock.assert_async().await;
    assert_eq!(response.status, 200);
    assert!(response.body.starts_with("data:image/png;base64,iVBORw0KGgo="));
}

#[tokio::test]
async fn test_make_request_form_data() {
    let mut server = Server::new_async().await;
    
    let mock = server.mock("POST", "/")
        .with_status(200)
        .with_body("form-ok")
        .create_async()
        .await;

    // Create a temporary file
    let dir = tempfile::tempdir().unwrap();
    let file_path = dir.path().join("test_upload.txt");
    std::fs::write(&file_path, "upload content").unwrap();

    let req = HttpRequest {
        url: server.url(),
        method: "POST".to_string(),
        headers: HashMap::new(),
        body: BodyPayload::FormData {
            items: vec![
                FormDataItem {
                    key: "text_field".to_string(),
                    value: Some("text_value".to_string()),
                    item_type: Some("text".to_string()),
                    files: None,
                },
                FormDataItem {
                    key: "file_field".to_string(),
                    value: None,
                    item_type: Some("file".to_string()),
                    files: Some(vec![file_path.to_string_lossy().to_string()]),
                },
                FormDataItem {
                    key: "empty_field".to_string(),
                    value: None,
                    item_type: Some("text".to_string()),
                    files: None,
                },
            ],
        },
    };

    let response = make_request(req).await.unwrap();
    
    mock.assert_async().await;
    assert_eq!(response.status, 200);
    assert_eq!(response.body, "form-ok");
}
