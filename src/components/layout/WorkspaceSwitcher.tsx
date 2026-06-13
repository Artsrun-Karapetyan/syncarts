import { Edit2, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  isMemberWorkspace,
  isSharedWorkspace,
} from "../../contexts/workspace/sync/sharing";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useStoredUser } from "../../lib/session";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Select } from "../ui/Select";
import { WorkspaceNamePopover } from "./WorkspaceNamePopover";

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
    if (newWorkspaceName.trim()) createWorkspace(newWorkspaceName.trim());
    setIsCreatingWorkspace(false);
    setNewWorkspaceName("");
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
              setIsCreatingWorkspace(true);
              setIsRenamingWorkspace(false);
              setNewWorkspaceName("");
            } else {
              switchWorkspace(val);
            }
          }}
          options={[
            ...workspaces.map((w) => ({
              label: w.name,
              value: w.id,
              badge: isSharedWorkspace(w) ? "Shared" : undefined,
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
                {workspaces.length > 1 && (
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
                )}
              </div>
            ) : null
          }
          compact={mode === "topbar"}
          style={mode === "topbar" ? { width: 280 } : undefined}
        />
      </div>

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
