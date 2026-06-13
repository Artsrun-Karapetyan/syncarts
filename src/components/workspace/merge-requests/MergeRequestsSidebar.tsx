import { Ban, GitMerge, GitPullRequest } from "lucide-react";

import { MergeRequestsSidebarEmptyText } from "./MergeRequestsSidebarEmptyText";

interface MergeRequestsSidebarProps {
  loading: boolean;
  mrs: any[];
  onSelectMr: (mr: any) => void;
  selectedMr: any | null;
}

export function MergeRequestsSidebar({
  loading,
  mrs,
  onSelectMr,
  selectedMr,
}: MergeRequestsSidebarProps) {
  return (
    <div
      style={{
        width: 320,
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {loading ? (
        <MergeRequestsSidebarEmptyText text="Loading..." />
      ) : mrs.length === 0 ? (
        <MergeRequestsSidebarEmptyText text="No merge requests found." />
      ) : (
        <div style={{ overflow: "auto", flex: 1 }}>
          {mrs.map((mr) => (
            <div
              key={mr.id}
              onClick={() => onSelectMr(mr)}
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--border-color)",
                cursor: "pointer",
                background:
                  selectedMr?.id === mr.id
                    ? "var(--bg-tertiary)"
                    : "transparent",
                transition: "background var(--transition-fast)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {mr.status === "MERGED" ? (
                    <GitMerge size={16} style={{ color: "#00ffaa" }} />
                  ) : mr.status === "REJECTED" ? (
                    <Ban size={16} style={{ color: "#ff5050" }} />
                  ) : (
                    <GitPullRequest size={16} style={{ color: "#00f0ff" }} />
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {mr.title}
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>By {mr.author?.name}</span>
                <span>{new Date(mr.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
