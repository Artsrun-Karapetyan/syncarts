use syncarts_lib::models::{BodyPayload, FormDataItem};

#[test]
fn deserializes_none_payload() {
    let payload: BodyPayload = serde_json::from_str(r#"{"type":"None"}"#).unwrap();

    assert!(matches!(payload, BodyPayload::None));
}

#[test]
fn deserializes_raw_payload() {
    let payload: BodyPayload =
        serde_json::from_str(r#"{"type":"Raw","content":"{\"ok\":true}"}"#).unwrap();

    match payload {
        BodyPayload::Raw { content } => assert_eq!(content, r#"{"ok":true}"#),
        _ => panic!("expected raw body payload"),
    }
}

#[test]
fn deserializes_form_data_payload() {
    let payload: BodyPayload = serde_json::from_str(
        r#"{"type":"FormData","items":[{"key":"name","value":"syncarts","type":"text"}]}"#,
    )
    .unwrap();

    match payload {
        BodyPayload::FormData { items } => {
            assert_eq!(items[0].key, "name");
            assert_eq!(items[0].value.as_deref(), Some("syncarts"));
        }
        _ => panic!("expected form-data payload"),
    }
}

#[test]
fn deserializes_file_form_data_item() {
    let item: FormDataItem =
        serde_json::from_str(r#"{"key":"file","type":"file","files":["/tmp/a.txt"]}"#).unwrap();

    assert_eq!(item.key, "file");
    assert_eq!(item.item_type.as_deref(), Some("file"));
    assert_eq!(item.files.unwrap(), vec!["/tmp/a.txt"]);
}

#[test]
fn deserializes_form_urlencoded_payload() {
    let payload: BodyPayload =
        serde_json::from_str(r#"{"type":"FormUrlEncoded","items":[{"key":"q","value":"search"}]}"#)
            .unwrap();

    assert!(matches!(payload, BodyPayload::FormUrlEncoded { .. }));
}

#[test]
fn serializes_raw_payload_shape() {
    let payload = BodyPayload::Raw {
        content: "hello".to_string(),
    };

    let json = serde_json::to_value(payload).unwrap();

    assert_eq!(json["type"], "Raw");
    assert_eq!(json["content"], "hello");
}

#[test]
fn rejects_unknown_payload_type() {
    let result = serde_json::from_str::<BodyPayload>(r#"{"type":"GraphQL","query":"{}"}"#);

    assert!(result.is_err());
}

#[test]
fn rejects_payload_without_type_tag() {
    let result = serde_json::from_str::<BodyPayload>(r#"{"content":"hello"}"#);

    assert!(result.is_err());
}
