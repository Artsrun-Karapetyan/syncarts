import { useNavigate } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";

import { useStoredUser } from "@/lib/session";

export function TopBarProfileButton() {
  const navigate = useNavigate();
  const user = useStoredUser();

  return (
    <div
      role="button"
      onClick={() => navigate({ to: user ? "/profile" : "/login" })}
      data-tauri-drag-region="false"
      style={
        {
          WebkitAppRegion: "no-drag",
          borderRadius: 9999,
          border: "1px solid var(--border-color)",
          background: "var(--bg-primary)",
          padding: "6px 16px 6px 6px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          transition: "border-color var(--transition-fast)",
          cursor: "pointer",
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-highlight)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
      }}
    >
      <div
        data-tauri-drag-region="false"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: user
            ? "linear-gradient(145deg, rgba(99, 102, 241, 0.35), rgba(99, 102, 241, 0.1))"
            : "rgba(255, 255, 255, 0.05)",
          border: user
            ? "2px solid rgba(99, 102, 241, 0.2)"
            : "2px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-primary)",
          flexShrink: 0,
        }}
      >
        <span data-tauri-drag-region="false">
          {user
            ? (user?.name?.trim()?.[0] ?? user?.email?.[0] ?? "A").toUpperCase()
            : "?"}
        </span>
      </div>
      <div
        data-tauri-drag-region="false"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {user ? user?.name?.trim() || "Your profile" : "Sign In"}
      </div>
      <Settings2
        size={13}
        style={{ color: "var(--text-tertiary)", marginLeft: 4 }}
      />
    </div>
  );
}
