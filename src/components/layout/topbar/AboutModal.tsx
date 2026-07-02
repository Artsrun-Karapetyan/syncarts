import { getVersion } from "@tauri-apps/api/app";
import { CheckCircle2, GitBranch, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAppUpdateContext } from "@/components/update/AppUpdateContext";
import { isTauriRuntime } from "@/lib/tauriRuntime";

const REPO_URL = "https://github.com/Artsrun-Karapetyan/syncarts";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [version, setVersion] = useState<string | null>(null);
  const { checkForUpdate, installUpdate, status } = useAppUpdateContext();

  useEffect(() => {
    if (!isOpen || !isTauriRuntime()) return;
    void getVersion().then(setVersion);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
        }}
        onClick={onClose}
      />

      <div
        className="glass-panel animate-scale-in"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          textAlign: "center",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "transparent",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            display: "flex",
            padding: 4,
          }}
        >
          <X size={16} />
        </button>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background:
              "linear-gradient(180deg, rgba(99, 102, 241, 0.28), rgba(99, 102, 241, 0.12))",
            border: "2px solid rgba(99, 102, 241, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <GitBranch size={26} style={{ color: "var(--accent-primary)" }} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Syncarts</h2>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Version {version || "-"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            marginTop: 8,
          }}
        >
          Created by Artsrun Karapetyan
        </div>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 13,
            color: "var(--accent-primary)",
            marginTop: 4,
          }}
        >
          {REPO_URL.replace("https://", "")}
        </a>

        {(() => {
          let buttonText = "Check for updates";
          if (status === "checking") buttonText = "Checking...";
          else if (status === "installing") buttonText = "Installing...";
          else if (status === "available") buttonText = "Install update";

          const isUpdateAvailable =
            status === "available" || status === "installing";
          const isBusy = status === "checking" || status === "installing";

          return (
            <button
              className={isUpdateAvailable ? "btn btn-primary" : "btn"}
              style={{
                marginTop: 18,
                width: "100%",
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              disabled={isBusy}
              onClick={isUpdateAvailable ? installUpdate : checkForUpdate}
            >
              <div style={{ display: "flex", alignItems: "center", width: 14 }}>
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isUpdateAvailable ? (
                  <CheckCircle2 size={14} />
                ) : null}
              </div>
              <span style={{ minWidth: 125, textAlign: "left" }}>
                {buttonText}
              </span>
            </button>
          );
        })()}
      </div>
    </div>
  );
}
