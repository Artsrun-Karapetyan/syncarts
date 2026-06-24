import { useEffect } from "react";

export function useKeyboardShortcuts({
  addTab,
}: {
  addTab: (...args: never[]) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Prevent Cmd+R / Ctrl+R browser refresh; only reload in dev mode
      if (cmdOrCtrl && e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (import.meta.env.DEV) {
          window.location.reload();
        }
      }

      if (cmdOrCtrl && e.key.toLowerCase() === "t") {
        e.preventDefault();
        addTab();
      }

      // Prevent ESC from exiting macOS fullscreen
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addTab]);
}
