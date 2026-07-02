import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AppUpdateMetadata,
  AppUpdateStatus,
} from "@/components/update/appUpdateTypes";
import { isUpdaterConfigError } from "@/components/update/isUpdaterConfigError";
import { isTauriRuntime } from "@/lib/tauriRuntime";

export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdateMetadata | null>(null);
  const [status, setStatus] = useState<AppUpdateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const checkForUpdate = useCallback(() => {
    if (!isTauriRuntime()) return;

    setStatus("checking");
    setError(null);
    Promise.all([
      invoke<AppUpdateMetadata | null>("check_app_update"),
      new Promise((resolve) => setTimeout(resolve, 600)),
    ])
      .then(([nextUpdate]) => {
        if (!isMountedRef.current) return;
        setUpdate(nextUpdate);
        setStatus(nextUpdate ? "available" : "idle");
      })
      .catch((error: unknown) => {
        if (!isMountedRef.current) return;
        setStatus("idle");
        if (!isUpdaterConfigError(error)) setError(String(error));
      });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!isTauriRuntime()) return;

    checkForUpdate();

    const interval = setInterval(checkForUpdate, 30 * 60 * 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkForUpdate]);

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

  return { checkForUpdate, error, installUpdate, status, update };
}
