pub(super) fn parse_method(method: &str) -> Result<reqwest::Method, String> {
    match method.to_uppercase().as_str() {
        "GET" => Ok(reqwest::Method::GET),
        "POST" => Ok(reqwest::Method::POST),
        "PUT" => Ok(reqwest::Method::PUT),
        "DELETE" => Ok(reqwest::Method::DELETE),
        "PATCH" => Ok(reqwest::Method::PATCH),
        _ => Err("Invalid HTTP method".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::parse_method;

    #[test]
    fn accepts_get_case_insensitively() {
        assert_eq!(parse_method("get").unwrap(), reqwest::Method::GET);
    }

    #[test]
    fn accepts_post_case_insensitively() {
        assert_eq!(parse_method("POST").unwrap(), reqwest::Method::POST);
    }

    #[test]
    fn accepts_put_case_insensitively() {
        assert_eq!(parse_method("Put").unwrap(), reqwest::Method::PUT);
    }

    #[test]
    fn accepts_delete_case_insensitively() {
        assert_eq!(parse_method("delete").unwrap(), reqwest::Method::DELETE);
    }

    #[test]
    fn accepts_patch_case_insensitively() {
        assert_eq!(parse_method("Patch").unwrap(), reqwest::Method::PATCH);
    }

    #[test]
    fn rejects_unsupported_methods() {
        assert_eq!(parse_method("TRACE").unwrap_err(), "Invalid HTTP method");
    }

    #[test]
    fn rejects_methods_with_whitespace() {
        assert_eq!(parse_method(" GET ").unwrap_err(), "Invalid HTTP method");
    }
}
