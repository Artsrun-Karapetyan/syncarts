import { GitPullRequest } from "lucide-react";

import { MergeRequestChanges } from "./MergeRequestChanges";
import { MergeRequestStatusBadge } from "./MergeRequestStatusBadge";

interface MergeRequestDetailsProps {
  error: string | null;
  merging: boolean;
  onMerge: () => void;
  onReject: () => void;
  onDelete: () => void;
  selectedMr: any | null;
  sourceCollection: any | null;
  targetCollection: any | null;
}

export function MergeRequestDetails({
  error,
  merging,
  onMerge,
  onReject,
  onDelete,
  selectedMr,
  sourceCollection,
  targetCollection,
}: MergeRequestDetailsProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      {selectedMr ? (
        <div style={{ padding: 40, width: "100%", boxSizing: "border-box" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                {selectedMr.title}
              </h3>
              {selectedMr.author && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Opened by
                  <span
                    style={{ fontWeight: 600, color: "var(--text-secondary)" }}
                  >
                    {selectedMr.author.name || selectedMr.author.email}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <MergeRequestStatusBadge status={selectedMr.status} />
              <button
                onClick={onDelete}
                className="btn"
                style={{
                  background: "rgba(255, 80, 80, 0.1)",
                  color: "#ff5050",
                  border: "none",
                  padding: "6px 12px",
                }}
              >
                Delete
              </button>
            </div>
          </div>
          {selectedMr.description && (
            <div
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginBottom: 32,
                padding: 20,
                background: "var(--bg-primary)",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
              }}
            >
              {selectedMr.description}
            </div>
          )}
          <MergeRequestChanges
            error={error}
            merging={merging}
            selectedMr={selectedMr}
            sourceCollection={sourceCollection}
            targetCollection={targetCollection}
            onMerge={onMerge}
            onReject={onReject}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            fontSize: 15,
            flexDirection: "column",
            gap: 16,
          }}
        >
          <GitPullRequest size={48} style={{ opacity: 0.2 }} />
          Select a merge request from the sidebar to review
        </div>
      )}
    </div>
  );
}
