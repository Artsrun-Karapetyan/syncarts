use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use std::collections::HashMap;

pub(super) fn build_headers(
    headers: HashMap<String, String>,
    skip_content_type: bool,
) -> HeaderMap {
    let mut result = HeaderMap::new();

    for (key, value) in headers {
        if let (Ok(name), Ok(value)) = (
            HeaderName::from_bytes(key.as_bytes()),
            HeaderValue::from_str(&value),
        ) {
            if skip_content_type && name == reqwest::header::CONTENT_TYPE {
                continue;
            }
            result.insert(name, value);
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::build_headers;
    use std::collections::HashMap;

    #[test]
    fn keeps_valid_headers() {
        let headers = HashMap::from([("Accept".to_string(), "application/json".to_string())]);

        let result = build_headers(headers, false);

        assert_eq!(result.get("accept").unwrap(), "application/json");
    }

    #[test]
    fn skips_invalid_header_names() {
        let headers = HashMap::from([("Bad Header".to_string(), "ignored".to_string())]);

        let result = build_headers(headers, false);

        assert!(result.get("bad header").is_none());
    }

    #[test]
    fn skips_invalid_header_values() {
        let headers = HashMap::from([("X-Bad".to_string(), "bad\nvalue".to_string())]);

        let result = build_headers(headers, false);

        assert!(result.get("x-bad").is_none());
    }

    #[test]
    fn skips_content_type_for_auto_bodies() {
        let headers = HashMap::from([
            ("Content-Type".to_string(), "application/json".to_string()),
            ("Accept".to_string(), "application/json".to_string()),
        ]);

        let result = build_headers(headers, true);

        assert!(result.get(reqwest::header::CONTENT_TYPE).is_none());
        assert_eq!(result.get("accept").unwrap(), "application/json");
    }

    #[test]
    fn keeps_content_type_for_raw_bodies() {
        let headers = HashMap::from([("Content-Type".to_string(), "application/json".to_string())]);

        let result = build_headers(headers, false);

        assert_eq!(
            result.get(reqwest::header::CONTENT_TYPE).unwrap(),
            "application/json"
        );
    }

    #[test]
    fn skips_content_type_case_insensitively() {
        let headers = HashMap::from([("content-type".to_string(), "application/json".to_string())]);

        let result = build_headers(headers, true);

        assert!(result.get(reqwest::header::CONTENT_TYPE).is_none());
    }
}
