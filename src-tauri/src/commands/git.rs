use serde::{Deserialize, Serialize};
use tokio::process::Command;

#[derive(Serialize, Deserialize, Clone)]
pub struct GitBranch {
    pub name: String,
    pub is_remote: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct GitSyncStatus {
    pub ahead: u32,
    pub behind: u32,
    pub upstream: Option<String>,
}

#[tauri::command]
pub async fn git_check_repo(path: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .arg("rev-parse")
        .arg("--is-inside-work-tree")
        .output()
        .await;

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
            Ok(stdout == "true")
        }
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn git_get_current_branch(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .arg("branch")
        .arg("--show-current")
        .output()
        .await;

    match output {
        Ok(out) => {
            if out.status.success() {
                Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute git: {}", e)),
    }
}

#[tauri::command]
pub async fn git_get_branches(path: String) -> Result<Vec<GitBranch>, String> {
    // Get all branches (local and remote)
    let output = Command::new("git")
        .current_dir(&path)
        .arg("branch")
        .arg("-a")
        .arg("--format=%(refname:short)")
        .output()
        .await;

    match output {
        Ok(out) => {
            if out.status.success() {
                let branches: Vec<GitBranch> = String::from_utf8_lossy(&out.stdout)
                    .lines()
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .filter(|s| !s.contains("HEAD ->")) // Ignore HEAD pointers
                    .map(|s| {
                        let is_remote = s.starts_with("origin/") || s.starts_with("remotes/");
                        let name = if s.starts_with("origin/") {
                            s.replacen("origin/", "", 1)
                        } else if s.starts_with("remotes/origin/") {
                            s.replacen("remotes/origin/", "", 1)
                        } else {
                            s
                        };
                        GitBranch { name, is_remote }
                    })
                    // Filter duplicates (if a branch is both local and remote, we might see it twice, but we want unique ones, or let the frontend group them)
                    .collect();
                
                // Remove exact duplicates
                let mut unique_branches = Vec::new();
                for b in branches {
                    if !unique_branches.iter().any(|existing: &GitBranch| existing.name == b.name && existing.is_remote == b.is_remote) {
                        unique_branches.push(b);
                    }
                }

                Ok(unique_branches)
            } else {
                Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute git: {}", e)),
    }
}

#[tauri::command]
pub async fn git_checkout_branch(path: String, branch: String) -> Result<bool, String> {
    // We use --no-pager and an empty stdin to prevent hanging
    let output = Command::new("git")
        .current_dir(&path)
        .arg("--no-pager")
        .arg("checkout")
        .arg(&branch)
        // Prevent asking for input
        .env("GIT_TERMINAL_PROMPT", "0")
        .output()
        .await;

    match output {
        Ok(out) => {
            if out.status.success() {
                Ok(true)
            } else {
                let err_msg = String::from_utf8_lossy(&out.stderr).trim().to_string();
                if err_msg.contains("Your local changes") || err_msg.contains("untracked working tree files") {
                    Err("Uncommitted changes: Please commit or stash your changes before switching branches.".to_string())
                } else {
                    Err(err_msg)
                }
            }
        }
        Err(e) => Err(format!("Failed to execute git checkout: {}", e)),
    }
}

#[tauri::command]
pub async fn git_get_sync_status(path: String, do_fetch: Option<bool>) -> Result<GitSyncStatus, String> {
    if do_fetch.unwrap_or(false) {
        let _ = Command::new("git")
            .current_dir(&path)
            .arg("fetch")
            .env("GIT_TERMINAL_PROMPT", "0")
            .output()
            .await;
    }

    let upstream_out = Command::new("git")
        .current_dir(&path)
        .arg("rev-parse")
        .arg("--abbrev-ref")
        .arg("--symbolic-full-name")
        .arg("@{u}")
        .output()
        .await;

    let upstream = match upstream_out {
        Ok(out) if out.status.success() => {
            let u = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if u.is_empty() { None } else { Some(u) }
        }
        _ => None,
    };

    if let Some(up) = &upstream {
        // Only count commits that touch .syncarts — this repo may contain unrelated
        // app code, and the user only cares about sync status for their workspace data.
        let ahead = count_commits_touching_path(&path, &format!("{}..HEAD", up)).await;
        let behind = count_commits_touching_path(&path, &format!("HEAD..{}", up)).await;
        return Ok(GitSyncStatus { ahead, behind, upstream: Some(up.clone()) });
    }

    Ok(GitSyncStatus { ahead: 0, behind: 0, upstream: None })
}

async fn count_commits_touching_path(repo_path: &str, range: &str) -> u32 {
    let output = Command::new("git")
        .current_dir(repo_path)
        .arg("rev-list")
        .arg("--count")
        .arg(range)
        .arg("--")
        .arg(".syncarts")
        .output()
        .await;

    match output {
        Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout)
            .trim()
            .parse::<u32>()
            .unwrap_or(0),
        _ => 0,
    }
}

#[tauri::command]
pub async fn git_pull(path: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .arg("pull")
        .env("GIT_TERMINAL_PROMPT", "0")
        .output()
        .await;

    match output {
        Ok(out) => {
            if out.status.success() {
                Ok(true)
            } else {
                Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute git pull: {}", e)),
    }
}

#[tauri::command]
pub async fn git_push(path: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .arg("push")
        .env("GIT_TERMINAL_PROMPT", "0")
        .output()
        .await;

    match output {
        Ok(out) => {
            if out.status.success() {
                Ok(true)
            } else {
                Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute git push: {}", e)),
    }
}

