import { Download, X } from "lucide-react";
import { useState } from "react";

import { useAppUpdate } from "./useAppUpdate";

export function AppUpdateBanner() {
  const { error, installUpdate, status, update } = useAppUpdate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!update || isDismissed) return null;

  const isInstalling = status === "installing";

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 10000,
        width: "min(420px, calc(100vw - 32px))",
        border: "1px solid var(--border-highlight)",
        borderRadius: 8,
        background: "var(--bg-secondary)",
        boxShadow: "var(--shadow-md)",
        color: "var(--text-primary)",
        padding: 14,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "rgba(34, 197, 94, 0.12)",
            color: "var(--accent-success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Download size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            Syncarts {update.version} is available
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.45,
            }}
          >
            Current version: {update.currentVersion}
          </div>
          {error && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--status-delete)",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}
          <button
            onClick={() => void installUpdate()}
            disabled={isInstalling}
            style={{
              marginTop: 12,
              height: 32,
              border: "none",
              borderRadius: 6,
              padding: "0 12px",
              background: isInstalling
                ? "var(--bg-tertiary)"
                : "var(--accent-success)",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              cursor: isInstalling ? "default" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Download size={14} />
            {isInstalling ? "Downloading..." : "Download update"}
          </button>
        </div>
        <button
          aria-label="Dismiss update"
          onClick={() => setIsDismissed(true)}
          style={{
            width: 28,
            height: 28,
            border: "none",
            borderRadius: 6,
            background: "transparent",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
