import { invoke } from "@tauri-apps/api/core";

import { isTauriRuntime } from "@/lib/tauriRuntime";

const IDB_SECRETS_KEY = "__syncarts_secrets__";

function getFallbackSecrets(): Record<string, string> {
  try {
    const raw = localStorage.getItem(IDB_SECRETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse fallback secrets", e);
  }
  return {};
}

function saveFallbackSecrets(secrets: Record<string, string>) {
  localStorage.setItem(IDB_SECRETS_KEY, JSON.stringify(secrets));
}

export async function getWorkspaceSecrets(
  workspaceId: string,
): Promise<Record<string, string>> {
  if (isTauriRuntime()) {
    try {
      const secretString = await invoke<string>("get_secret", {
        id: `ws_${workspaceId}`,
      });
      if (secretString) return JSON.parse(secretString);
    } catch (e) {
      console.warn(
        `Failed to get secrets for ${workspaceId} from keychain:`,
        e,
      );
    }
    return {};
  } else {
    const all = getFallbackSecrets();
    const secretString = all[`ws_${workspaceId}`];
    return secretString ? JSON.parse(secretString) : {};
  }
}

export async function setWorkspaceSecrets(
  workspaceId: string,
  secrets: Record<string, string>,
): Promise<void> {
  const value = JSON.stringify(secrets);
  if (isTauriRuntime()) {
    try {
      await invoke("set_secret", { id: `ws_${workspaceId}`, value });
    } catch (e) {
      console.error(`Failed to set secrets for ${workspaceId} in keychain:`, e);
    }
  } else {
    const all = getFallbackSecrets();
    all[`ws_${workspaceId}`] = value;
    saveFallbackSecrets(all);
  }
}

export async function deleteWorkspaceSecrets(
  workspaceId: string,
): Promise<void> {
  if (isTauriRuntime()) {
    try {
      await invoke("delete_secret", { id: `ws_${workspaceId}` });
    } catch (e) {
      console.error(
        `Failed to delete secrets for ${workspaceId} from keychain:`,
        e,
      );
    }
  } else {
    const all = getFallbackSecrets();
    delete all[`ws_${workspaceId}`];
    saveFallbackSecrets(all);
  }
}
