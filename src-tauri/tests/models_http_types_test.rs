use std::collections::HashMap;

use syncarts_lib::models::{BodyPayload, FormDataItem, HttpRequest, HttpResponse};

#[test]
fn http_request_round_trips_json_shape() {
    let request = HttpRequest {
        url: "https://example.com".to_string(),
        method: "POST".to_string(),
        headers: HashMap::from([("Accept".to_string(), "application/json".to_string())]),
        body: BodyPayload::FormUrlEncoded {
            items: vec![FormDataItem {
                key: "q".to_string(),
                value: Some("search".to_string()),
                item_type: Some("text".to_string()),
                files: None,
            }],
        },
    };

    let json = serde_json::to_string(&request).unwrap();
    let parsed: HttpRequest = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed.url, request.url);
    assert_eq!(parsed.method, request.method);
    assert_eq!(parsed.headers.get("Accept").unwrap(), "application/json");
    assert!(matches!(parsed.body, BodyPayload::FormUrlEncoded { .. }));
}

#[test]
fn http_request_preserves_header_names() {
    let request: HttpRequest = serde_json::from_str(
        r#"{"url":"https://example.com","method":"GET","headers":{"X-Token":"abc"},"body":{"type":"None"}}"#,
    )
    .unwrap();

    assert_eq!(request.headers.get("X-Token").unwrap(), "abc");
}

#[test]
fn http_request_requires_url() {
    let result = serde_json::from_str::<HttpRequest>(
        r#"{"method":"GET","headers":{},"body":{"type":"None"}}"#,
    );

    assert!(result.is_err());
}

#[test]
fn http_request_requires_body() {
    let result = serde_json::from_str::<HttpRequest>(
        r#"{"url":"https://example.com","method":"GET","headers":{}}"#,
    );

    assert!(result.is_err());
}

#[test]
fn http_response_round_trips_json_shape() {
    let response = HttpResponse {
        status: 200,
        status_text: "200 OK".to_string(),
        headers: HashMap::from([("content-type".to_string(), "application/json".to_string())]),
        body: "{\"ok\":true}".to_string(),
        time_ms: 15,
    };

    let json = serde_json::to_string(&response).unwrap();
    let parsed: HttpResponse = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed.status, 200);
    assert_eq!(parsed.status_text, "200 OK");
    assert_eq!(
        parsed.headers.get("content-type").unwrap(),
        "application/json"
    );
    assert_eq!(parsed.body, "{\"ok\":true}");
    assert_eq!(parsed.time_ms, 15);
}

#[test]
fn http_response_allows_empty_headers() {
    let response: HttpResponse = serde_json::from_str(
        r#"{"status":204,"status_text":"204 No Content","headers":{},"body":"","time_ms":1}"#,
    )
    .unwrap();

    assert_eq!(response.status, 204);
    assert!(response.headers.is_empty());
}
