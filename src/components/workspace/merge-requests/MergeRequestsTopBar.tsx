import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, GitPullRequest } from "lucide-react";
import type React from "react";

export function MergeRequestsTopBar() {
  const navigate = useNavigate();

  return (
    <div
      className="topbar"
      data-tauri-drag-region
      style={
        {
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          height: 48,
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-primary)",
        } as React.CSSProperties
      }
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => navigate({ to: "/" })}
          data-tauri-drag-region="false"
          style={
            {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              color: "var(--text-secondary)",
              cursor: "pointer",
              WebkitAppRegion: "no-drag",
            } as React.CSSProperties
          }
        >
          <ArrowLeft size={14} /> Back to Workspace
        </button>
        <div
          style={{ width: 1, height: 24, background: "var(--border-color)" }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--text-primary)",
          }}
        >
          <GitPullRequest size={16} style={{ color: "#b000ff" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Merge Requests</span>
        </div>
      </div>
    </div>
  );
}
