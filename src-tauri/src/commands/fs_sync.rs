use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

#[derive(Serialize)]
pub struct LocalFile {
    pub relative_path: String,
    pub content: String,
}

#[tauri::command]
pub fn read_local_workspace(path: String) -> Result<Vec<LocalFile>, String> {
    let base_path = Path::new(&path);
    if !base_path.exists() || !base_path.is_dir() {
        return Err("Directory does not exist".into());
    }

    let mut files = Vec::new();
    
    // Read syncarts.json
    let syncarts_path = base_path.join("syncarts.json");
    if syncarts_path.exists() && syncarts_path.is_file() {
        if let Ok(content) = fs::read_to_string(&syncarts_path) {
            files.push(LocalFile {
                relative_path: "syncarts.json".to_string(),
                content,
            });
        }
    }

    let mut dirs_to_visit = vec![base_path.join("collections"), base_path.join("environments")];

    while let Some(current_dir) = dirs_to_visit.pop() {
        if !current_dir.exists() || !current_dir.is_dir() {
            continue;
        }
        if let Ok(entries) = fs::read_dir(&current_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    dirs_to_visit.push(path);
                } else if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "json" {
                            if let Ok(content) = fs::read_to_string(&path) {
                                if let Ok(stripped) = path.strip_prefix(base_path) {
                                    files.push(LocalFile {
                                        relative_path: stripped.to_string_lossy().to_string().replace("\\", "/"),
                                        content,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(files)
}

#[tauri::command]
pub fn write_local_file(base_path: String, relative_path: String, content: String) -> Result<(), String> {
    let path = Path::new(&base_path).join(&relative_path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_local_file(base_path: String, relative_path: String) -> Result<(), String> {
    let path = Path::new(&base_path).join(&relative_path);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn delete_local_dir(base_path: String, relative_path: String) -> Result<(), String> {
    let path = Path::new(&base_path).join(&relative_path);
    if path.exists() && path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub struct FsWatcherState {
    pub watchers: Mutex<HashMap<String, RecommendedWatcher>>,
}

#[tauri::command]
pub fn watch_local_workspace(app: AppHandle, state: State<'_, FsWatcherState>, path: String) -> Result<(), String> {
    let mut watchers = state.watchers.lock().unwrap();
    if watchers.contains_key(&path) {
        return Ok(()); // Already watching
    }

    let path_clone = path.clone();
    let app_clone = app.clone();
    
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        match res {
            Ok(event) => {
                let mut relevant = false;
                for p in event.paths.iter() {
                    let path_str = p.to_string_lossy().replace("\\", "/");
                    if path_str.contains("/collections/") || 
                       path_str.contains("/environments/") || 
                       path_str.ends_with("syncarts.json") {
                        relevant = true;
                        break;
                    }
                }

                if relevant {
                    let paths: Vec<String> = event.paths.iter().map(|p| p.to_string_lossy().to_string()).collect();
                    let _ = app_clone.emit("fs_event", serde_json::json!({
                        "workspace": path_clone.clone(),
                        "kind": format!("{:?}", event.kind),
                        "paths": paths
                    }));
                }
            },
            Err(e) => println!("watch error: {:?}", e),
        }
    }).map_err(|e| e.to_string())?;

    let base = Path::new(&path);
    watcher.watch(&base, RecursiveMode::Recursive).map_err(|e| format!("Failed to watch workspace: {}", e))?;

    watchers.insert(path, watcher);

    Ok(())
}

#[tauri::command]
pub fn unwatch_local_workspace(state: State<'_, FsWatcherState>, path: String) -> Result<(), String> {
    let mut watchers = state.watchers.lock().unwrap();
    watchers.remove(&path);
    Ok(())
}
