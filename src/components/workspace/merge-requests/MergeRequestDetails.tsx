import { GitPullRequest } from "lucide-react";

import { MergeRequestChanges } from "./MergeRequestChanges";
import { MergeRequestStatusBadge } from "./MergeRequestStatusBadge";

interface MergeRequestDetailsProps {
  collections: any[];
  error: string | null;
  merging: boolean;
  onMerge: () => void;
  onReject: () => void;
  selectedMr: any | null;
  sourceCollection: any | null;
}

export function MergeRequestDetails({
  collections,
  error,
  merging,
  onMerge,
  onReject,
  selectedMr,
  sourceCollection,
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
            <MergeRequestStatusBadge status={selectedMr.status} />
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
            collections={collections}
            error={error}
            merging={merging}
            selectedMr={selectedMr}
            sourceCollection={sourceCollection}
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
