import { useEffect } from "react";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Cmd+R / Ctrl+R browser refresh; only reload in dev mode
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (import.meta.env.DEV) {
          window.location.reload();
        }
      }

      // Prevent ESC from exiting macOS fullscreen
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
