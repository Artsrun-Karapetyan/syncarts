import { useNavigate } from "@tanstack/react-router";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Eye, LayoutGrid, LogIn, Settings2, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useStoredUser } from "../../lib/session";
import { EnvironmentManager } from "../environment/EnvironmentManager";
import { Select } from "../ui/Select";
import { InviteModal } from "../workspace/InviteModal";
import { JoinWorkspaceModal } from "../workspace/JoinWorkspaceModal";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function TopBar() {
  const {
    activeWorkspaceId,
    environments,
    globalVariables,
    activeEnvironmentId,
    setActiveEnvironmentId,
    activeEnvironment,
  } = useWorkspace();
  const navigate = useNavigate();
  const user = useStoredUser();
  const [isEnvManagerOpen, setIsEnvManagerOpen] = useState(false);
  const [isEnvQuickLookOpen, setIsEnvQuickLookOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const envQuickLookRef = useRef<HTMLDivElement>(null);
  const showingGlobals = activeEnvironmentId === "globals";
  const quickLookName = showingGlobals
    ? "Globals"
    : activeEnvironment
      ? activeEnvironment.name
      : "No Environment";
  const quickLookVariables = showingGlobals
    ? globalVariables
    : activeEnvironment?.variables || [];
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        envQuickLookRef.current &&
        !envQuickLookRef.current.contains(event.target as Node)
      ) {
        setIsEnvQuickLookOpen(false);
      }
    };

    if (isEnvQuickLookOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEnvQuickLookOpen]);

  useEffect(() => {
    const currentWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    let isMounted = true;

    void currentWindow.isFullscreen().then((value) => {
      if (isMounted) setIsFullscreen(value);
    });

    void currentWindow
      .onResized(async () => {
        setIsFullscreen(await currentWindow.isFullscreen());
      })
      .then((dispose) => {
        unlisten = dispose;
      });

    return () => {
      isMounted = false;
      unlisten?.();
    };
  }, []);

  const isMac = navigator.userAgent.includes("Mac");
  const handleWindowDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isInteractive = target.closest(
      'button, input, textarea, select, a, [role="button"]',
    );
    if (event.button !== 0 || isInteractive) return;

    getCurrentWindow()
      .startDragging()
      .catch((err) => {
        console.error("Failed to start window drag", err);
      });
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleWindowDrag}
      style={{
        height: 48,
        width: "100%",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 24px",
        paddingLeft: isMac && !isFullscreen ? 80 : 24,
        flexShrink: 0,
        position: "relative",
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minWidth: 300,
          flexShrink: 0,
        }}
      >
        <WorkspaceSwitcher mode="topbar" />
      </div>

      <div
        data-tauri-drag-region
        onMouseDown={handleWindowDrag}
        style={{
          flex: 1,
          alignSelf: "stretch",
          minWidth: 64,
          cursor: "grab",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="btn"
            style={{ height: 28, padding: "0 12px", fontSize: 13 }}
            onClick={() => setIsJoinOpen(true)}
          >
            <LogIn size={14} style={{ marginRight: 6 }} />
            Join
          </button>
          <button
            className="btn"
            style={{ height: 28, padding: "0 12px", fontSize: 13 }}
            onClick={() => setIsInviteOpen(true)}
          >
            <UserPlus size={14} style={{ marginRight: 6 }} />
            Invite
          </button>
        </div>

        {/* Environment Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }} ref={envQuickLookRef}>
            <button
              className="tooltip-trigger"
              data-tooltip="Environment Quick Look"
              data-tooltip-pos="right"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
              }}
              onClick={() => setIsEnvQuickLookOpen(!isEnvQuickLookOpen)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-tertiary)")
              }
            >
              <Eye size={18} />
            </button>
            {isEnvQuickLookOpen && (
              <div
                className="glass-panel animate-fade-in"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 300,
                  padding: 16,
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {quickLookName}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {quickLookVariables
                    .filter((v) => v.enabled && v.key)
                    .map((v) => (
                      <div
                        key={v.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "var(--accent-primary)" }}>
                          {v.key}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {v.value || "-"}
                        </span>
                      </div>
                    ))}
                  {quickLookVariables.filter((v) => v.enabled && v.key)
                    .length === 0 && (
                    <div
                      style={{ fontSize: 12, color: "var(--text-tertiary)" }}
                    >
                      No active variables
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 144 }}>
            <Select
              variant="pill"
              compact
              value={activeEnvironmentId || "none"}
              onChange={(val) => {
                if (val === "none") setActiveEnvironmentId(null);
                else if (val === "globals") setActiveEnvironmentId("globals");
                else setActiveEnvironmentId(val);
              }}
              options={[
                { label: "No Environment", value: "none" },
                { label: "Globals", value: "globals" },
                ...environments.map((e) => ({ label: e.name, value: e.id })),
              ]}
            />
          </div>

          <button
            className="tooltip-trigger"
            data-tooltip="Manage Environments"
            data-tooltip-pos="right"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
            onClick={() => setIsEnvManagerOpen(true)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-tertiary)")
            }
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        {/* Profile */}
        <div
          role="button"
          onClick={() => navigate({ to: "/profile" })}
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
              background:
                "linear-gradient(145deg, rgba(99, 102, 241, 0.35), rgba(99, 102, 241, 0.1))",
              border: "2px solid rgba(99, 102, 241, 0.2)",
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
              {(
                user?.name?.trim()?.[0] ??
                user?.email?.[0] ??
                "A"
              ).toUpperCase()}
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
            {user?.name?.trim() || "Your profile"}
          </div>
          <Settings2
            size={13}
            style={{ color: "var(--text-tertiary)", marginLeft: 4 }}
          />
        </div>
      </div>

      <EnvironmentManager
        isOpen={isEnvManagerOpen}
        onClose={() => setIsEnvManagerOpen(false)}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={activeWorkspaceId}
      />

      <JoinWorkspaceModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />
    </div>
  );
}
