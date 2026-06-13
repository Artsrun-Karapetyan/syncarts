import { Download, FilePlus2, FolderPlus, GitPullRequest } from "lucide-react";

import { MergeRequestBadge } from "./MergeRequestBadge";
import { ToolbarButton } from "./ToolbarButton";

interface SidebarToolbarProps {
  openMrCount: number;
  onMergeRequests: () => void;
  onImport: () => void;
  onNewRequest: () => void;
  onNewCollection: () => void;
}

export function SidebarToolbar({
  openMrCount,
  onMergeRequests,
  onImport,
  onNewRequest,
  onNewCollection,
}: SidebarToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Collections
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <ToolbarButton
          tooltip="Merge Requests"
          icon={GitPullRequest}
          onClick={onMergeRequests}
          color={openMrCount > 0 ? "#00f0ff" : undefined}
          background={openMrCount > 0 ? "rgba(0, 240, 255, 0.1)" : undefined}
          hoverColor={openMrCount > 0 ? "#00f0ff" : "#b000ff"}
          hoverBackground={
            openMrCount > 0 ? "rgba(0, 240, 255, 0.2)" : "var(--bg-tertiary)"
          }
        >
          {openMrCount > 0 && <MergeRequestBadge count={openMrCount} />}
        </ToolbarButton>
        <ToolbarButton
          tooltip="Import (or drop file anywhere)"
          icon={Download}
          onClick={onImport}
        />
        <ToolbarButton
          tooltip="New Request"
          icon={FilePlus2}
          onClick={onNewRequest}
        />
        <ToolbarButton
          tooltip="New Collection"
          icon={FolderPlus}
          onClick={onNewCollection}
        />
      </div>
    </div>
  );
}
