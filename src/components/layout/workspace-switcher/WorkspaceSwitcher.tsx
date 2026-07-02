import { Edit2, Folder, Trash2, Users } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { GitBranchSelector } from "@/components/layout/sidebar/workspace/GitBranchSelector";
import { WorkspaceNamePopover } from "@/components/layout/workspace-switcher/WorkspaceNamePopover";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";
import { Select } from "@/components/ui/Select/Select";
import {
  isMemberWorkspace,
  isSharedWorkspace,
} from "@/contexts/workspace/sync/sharing";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getAuthToken } from "@/lib/auth";
import { useStoredUser } from "@/lib/session";

type WorkspaceSwitcherProps = {
  mode?: "sidebar" | "topbar";
};

const miniActionStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 7,
  border: "1px solid var(--border-color)",
  color: "var(--text-tertiary)",
  background: "rgba(10, 10, 10, 0.55)",
};

export function WorkspaceSwitcher({
  mode = "sidebar",
}: WorkspaceSwitcherProps) {
  const {
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    createWorkspace,
    removeWorkspace,
    renameWorkspace,
    localDefaultWorkspaceId,
  } = useWorkspace();
  const user = useStoredUser();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] = useState<"cloud" | "local">(
    "cloud",
  );
  const [newWorkspacePath, setNewWorkspacePath] = useState<string>("");
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
  const [renameWorkspaceName, setRenameWorkspaceName] = useState("");
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const createPopoverRef = useRef<HTMLDivElement | null>(null);
  const renamePopoverRef = useRef<HTMLDivElement | null>(null);
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );
  const isActiveMemberWorkspace = isMemberWorkspace(activeWorkspace, user?.id);
  const submitCreateWorkspace = () => {
    if (newWorkspaceType === "local" && !newWorkspacePath) {
      alert("Please select a local folder first.");
      return;
    }
    if (!newWorkspaceName.trim() && newWorkspaceType !== "local") {
      alert("Please enter a workspace name.");
      return;
    }

    createWorkspace(
      newWorkspaceName.trim() || "Local Workspace",
      undefined,
      undefined,
      newWorkspaceType,
      newWorkspacePath,
    );
    setIsCreatingWorkspace(false);
    setNewWorkspaceName("");
    setNewWorkspacePath("");
    setNewWorkspaceType("cloud");
  };
  const submitRenameWorkspace = () => {
    if (activeWorkspace && renameWorkspaceName.trim()) {
      renameWorkspace(activeWorkspace.id, renameWorkspaceName.trim());
    }
    setIsRenamingWorkspace(false);
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (createPopoverRef.current?.contains(event.target as Node)) return;
      if (renamePopoverRef.current?.contains(event.target as Node)) return;
      setIsCreatingWorkspace(false);
      setIsRenamingWorkspace(false);
    };

    if (isCreatingWorkspace || isRenamingWorkspace) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isCreatingWorkspace, isRenamingWorkspace]);

  useLayoutEffect(() => {
    if (!isCreatingWorkspace && !isRenamingWorkspace) return;

    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, mode === "topbar" ? 300 : 280),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isCreatingWorkspace, isRenamingWorkspace, mode]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: mode === "topbar" ? "row" : "column",
        alignItems: mode === "topbar" ? "center" : "stretch",
        gap: mode === "topbar" ? 6 : 8,
        padding: mode === "topbar" ? 0 : 10,
        minWidth: mode === "topbar" ? 300 : undefined,
        border: mode === "topbar" ? "none" : "1px solid var(--border-color)",
        borderRadius: mode === "topbar" ? 0 : 14,
        background: "transparent",
        boxShadow:
          mode === "topbar" ? "none" : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          display: mode === "topbar" ? "none" : "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Workspace
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Select
          variant="pill"
          value={activeWorkspaceId}
          onChange={(val) => {
            if (val === "new") {
              const hasToken = !!getAuthToken();
              setIsCreatingWorkspace(true);
              setIsRenamingWorkspace(false);
              setNewWorkspaceName("");
              setNewWorkspacePath("");
              setNewWorkspaceType(hasToken ? "cloud" : "local");
            } else {
              switchWorkspace(val);
            }
          }}
          options={[
            ...workspaces.map((w) => ({
              label: w.name,
              value: w.id,
              badge:
                w.type === "local" ? (
                  <Folder size={13} />
                ) : isSharedWorkspace(w) ? (
                  <Users size={13} />
                ) : undefined,
              badgeTooltip:
                w.type === "local"
                  ? "Local Folder Workspace"
                  : isSharedWorkspace(w)
                    ? "Shared Workspace"
                    : undefined,
            })),
            { label: "+ Create Workspace", value: "new" },
          ]}
          endAdornment={
            activeWorkspace &&
            activeWorkspace.id !== localDefaultWorkspaceId ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginRight: 2,
                }}
              >
                <button
                  type="button"
                  className="tooltip-trigger"
                  data-tooltip="Rename Workspace"
                  style={miniActionStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameWorkspaceName(activeWorkspace.name);
                    setIsRenamingWorkspace(true);
                    setIsCreatingWorkspace(false);
                  }}
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  className="tooltip-trigger"
                  data-tooltip={
                    isActiveMemberWorkspace
                      ? "Leave Workspace"
                      : "Delete Workspace"
                  }
                  style={miniActionStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteWorkspaceOpen(true);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : null
          }
          compact={mode === "topbar"}
          style={
            mode === "topbar" ? { minWidth: 240, maxWidth: 312 } : undefined
          }
        />
      </div>
      <GitBranchSelector mode={mode} />

      {isCreatingWorkspace && (
        <WorkspaceNamePopover
          actionLabel="Create"
          inputRef={createPopoverRef}
          mode={mode}
          position={popoverPosition}
          title="Create Workspace"
          value={newWorkspaceName}
          onCancel={() => {
            setIsCreatingWorkspace(false);
            setNewWorkspaceName("");
          }}
          onSubmit={submitCreateWorkspace}
          onValueChange={setNewWorkspaceName}
          workspaceType={newWorkspaceType}
          onWorkspaceTypeChange={setNewWorkspaceType}
          localPath={newWorkspacePath}
          onSelectLocalPath={async () => {
            const { open } = await import("@tauri-apps/plugin-dialog");
            const selected = await open({ directory: true, multiple: false });
            if (selected && !Array.isArray(selected)) {
              setNewWorkspacePath(selected as string);
              // We could try to auto-name it based on folder name if name is empty
              if (!newWorkspaceName) {
                const parts = (selected as string).split(/[\\/]/);
                setNewWorkspaceName(parts[parts.length - 1]);
              }
            }
          }}
          isAuthenticated={!!user}
        />
      )}

      {isRenamingWorkspace && activeWorkspace && (
        <WorkspaceNamePopover
          actionLabel="Rename"
          inputRef={renamePopoverRef}
          mode={mode}
          position={popoverPosition}
          title="Rename Workspace"
          value={renameWorkspaceName}
          onCancel={() => setIsRenamingWorkspace(false)}
          onSubmit={submitRenameWorkspace}
          onValueChange={setRenameWorkspaceName}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteWorkspaceOpen}
        title={isActiveMemberWorkspace ? "Leave Workspace" : "Delete Workspace"}
        message={
          isActiveMemberWorkspace
            ? `Leave "${activeWorkspace?.name}"? You will lose access until someone invites you again.`
            : `Delete "${activeWorkspace?.name}"? This removes the workspace and its collections for every member.`
        }
        confirmText={isActiveMemberWorkspace ? "Leave" : "Delete"}
        cancelText="Cancel"
        isDestructive
        onCancel={() => setIsDeleteWorkspaceOpen(false)}
        onConfirm={() => {
          if (!activeWorkspace) return;
          void removeWorkspace(activeWorkspace.id).finally(() =>
            setIsDeleteWorkspaceOpen(false),
          );
        }}
      />
    </div>
  );
}
