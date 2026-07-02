import { useNavigate } from "@tanstack/react-router";
import { Info, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AboutModal } from "@/components/layout/topbar/AboutModal";
import { useStoredUser } from "@/lib/session";

export function TopBarProfileButton() {
  const navigate = useNavigate();
  const user = useStoredUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMenuOpen]);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <div
        role="button"
        onClick={() => setIsMenuOpen((open) => !open)}
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
              ? "linear-gradient(145deg, rgba(139, 92, 246, 0.35), rgba(139, 92, 246, 0.1))"
              : "rgba(255, 255, 255, 0.05)",
            border: user
              ? "2px solid rgba(139, 92, 246, 0.2)"
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
              ? (
                  user?.name?.trim()?.[0] ??
                  user?.email?.[0] ??
                  "A"
                ).toUpperCase()
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

      {isMenuOpen && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 200,
            padding: 6,
            zIndex: 200,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <button
            className="btn"
            style={{
              width: "100%",
              justifyContent: "flex-start",
              border: "none",
              background: "transparent",
              height: 34,
            }}
            onClick={() => {
              setIsMenuOpen(false);
              void navigate({ to: user ? "/profile" : "/login" });
            }}
          >
            <Settings2 size={14} style={{ marginRight: 8 }} />
            {user ? "Profile" : "Sign In"}
          </button>
          <button
            className="btn"
            style={{
              width: "100%",
              justifyContent: "flex-start",
              border: "none",
              background: "transparent",
              height: 34,
            }}
            onClick={() => {
              setIsMenuOpen(false);
              setIsAboutOpen(true);
            }}
          >
            <Info size={14} style={{ marginRight: 8 }} />
            About Syncarts
          </button>
        </div>
      )}

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
