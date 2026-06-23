import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useWorkspaceGit } from "@/contexts/workspace/git/useWorkspaceGit";

export function GitSyncButton({ mode }: { mode?: "sidebar" | "topbar" }) {
  const { isSyncing, syncStatus, pullChanges, pushChanges, refreshSyncStatus } =
    useWorkspaceGit();

  if (!syncStatus) {
    return null;
  }

  if (syncStatus.ahead > 0 || syncStatus.behind > 0) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isSyncing) return;
          if (syncStatus.behind > 0) pullChanges();
          else if (syncStatus.ahead > 0) pushChanges();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "0 10px",
          height: mode === "topbar" ? 32 : 40,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          cursor: isSyncing ? "wait" : "pointer",
          color:
            syncStatus.behind > 0 ? "var(--status-get)" : "var(--status-post)",
          fontSize: 12,
          fontWeight: 600,
          transition: "all var(--transition-fast)",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isSyncing) {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.borderColor = "var(--border-highlight)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSyncing) {
            e.currentTarget.style.background = "var(--bg-secondary)";
            e.currentTarget.style.borderColor = "var(--border-color)";
          }
        }}
      >
        {isSyncing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : syncStatus.behind > 0 ? (
          <>
            <ArrowDownToLine size={14} />
            {syncStatus.behind}
          </>
        ) : (
          <>
            <ArrowUpFromLine size={14} />
            {syncStatus.ahead}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !isSyncing && refreshSyncStatus()}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: mode === "topbar" ? 32 : 40,
        height: mode === "topbar" ? 32 : 40,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        cursor: isSyncing ? "wait" : "pointer",
        color: "var(--text-tertiary)",
        transition: "all var(--transition-fast)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isSyncing) {
          e.currentTarget.style.background = "var(--bg-tertiary)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSyncing) {
          e.currentTarget.style.background = "var(--bg-secondary)";
          e.currentTarget.style.color = "var(--text-tertiary)";
        }
      }}
      title="Refresh Sync Status"
    >
      {isSyncing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <RefreshCw size={14} />
      )}
    </div>
  );
}
