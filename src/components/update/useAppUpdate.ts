import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import { isTauriRuntime } from "../../lib/tauriRuntime";
import type { AppUpdateMetadata, AppUpdateStatus } from "./appUpdateTypes";
import { isUpdaterConfigError } from "./isUpdaterConfigError";

export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdateMetadata | null>(null);
  const [status, setStatus] = useState<AppUpdateStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let isMounted = true;
    setStatus("checking");

    invoke<AppUpdateMetadata | null>("check_app_update")
      .then((nextUpdate) => {
        if (!isMounted) return;
        setUpdate(nextUpdate);
        setStatus(nextUpdate ? "available" : "idle");
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setStatus("idle");
        if (!isUpdaterConfigError(error)) setError(String(error));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const installUpdate = async () => {
    setError(null);
    setStatus("installing");

    try {
      await invoke("install_app_update");
    } catch (error) {
      setError(String(error));
      setStatus(update ? "available" : "idle");
    }
  };

  return { error, installUpdate, status, update };
}
