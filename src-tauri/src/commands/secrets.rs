use keyring::Entry;

#[tauri::command]
pub fn get_secret(id: String) -> Result<Option<String>, String> {
    let entry = Entry::new("syncarts_secrets", &id).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_secret(id: String, value: String) -> Result<(), String> {
    let entry = Entry::new("syncarts_secrets", &id).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_secret(id: String) -> Result<(), String> {
    let entry = Entry::new("syncarts_secrets", &id).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Ignore if not exists
        Err(e) => Err(e.to_string()),
    }
}
