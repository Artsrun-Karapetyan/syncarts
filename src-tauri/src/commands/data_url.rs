pub(super) fn decode_data_url(value: &str) -> Result<Vec<u8>, String> {
    use base64::{engine::general_purpose, Engine as _};

    let (_, data) = value
        .split_once(',')
        .ok_or_else(|| "Invalid data URL response body".to_string())?;

    general_purpose::STANDARD
        .decode(data)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::decode_data_url;

    #[test]
    fn decodes_text_payload() {
        assert_eq!(
            decode_data_url("data:text/plain;base64,aGVsbG8=").unwrap(),
            b"hello"
        );
    }

    #[test]
    fn decodes_binary_payload() {
        assert_eq!(
            decode_data_url("data:application/octet-stream;base64,AAEC").unwrap(),
            vec![0, 1, 2]
        );
    }

    #[test]
    fn allows_empty_payload() {
        assert_eq!(decode_data_url("data:text/plain;base64,").unwrap(), b"");
    }

    #[test]
    fn rejects_missing_payload_separator() {
        assert_eq!(
            decode_data_url("data:text/plain;base64").unwrap_err(),
            "Invalid data URL response body"
        );
    }

    #[test]
    fn rejects_invalid_base64_payload() {
        assert!(decode_data_url("data:text/plain;base64,%%%").is_err());
    }
}
