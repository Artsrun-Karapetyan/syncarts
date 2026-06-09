use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize, Serialize)]
pub struct FormDataItem {
    pub key: String,
    pub value: Option<String>,
    #[serde(rename = "type")]
    pub item_type: Option<String>,
    pub files: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum BodyPayload {
    None,
    Raw { content: String },
    FormData { items: Vec<FormDataItem> },
    FormUrlEncoded { items: Vec<FormDataItem> },
}

#[derive(Debug, Deserialize, Serialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: BodyPayload,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub time_ms: u64,
}
