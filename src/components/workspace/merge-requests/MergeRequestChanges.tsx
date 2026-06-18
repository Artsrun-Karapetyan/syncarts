import { Ban, GitMerge } from "lucide-react";

import { MergeRequestChangeSummary } from "./MergeRequestChangeSummary";
import { getMergeRequestChanges } from "./mergeRequestDiff";
import { MergeRequestDiffItem } from "./MergeRequestDiffItem";
import { MergeRequestError } from "./MergeRequestError";

interface MergeRequestChangesProps {
  canReview: boolean;
  error: string | null;
  merging: boolean;
  onMerge: () => void;
  onReject: () => void;
  selectedMr: any;
  sourceCollection: any | null;
  targetCollection: any | null;
}

export function MergeRequestChanges({
  canReview,
  error,
  merging,
  onMerge,
  onReject,
  selectedMr,
  sourceCollection,
  targetCollection,
}: MergeRequestChangesProps) {
  if (selectedMr.status !== "OPEN") return null;

  const targetCol = targetCollection;
  const changes =
    targetCol && sourceCollection
      ? getMergeRequestChanges(targetCol, sourceCollection)
      : null;

  return (
    <div
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          background: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--border-color)",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Changes to be merged
      </div>
      <div
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {error && <MergeRequestError text={error} />}
        {!sourceCollection && !error ? (
          <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
            Loading changes...
          </div>
        ) : !targetCol ? (
          <div style={{ color: "#ff5050" }}>Target collection not found!</div>
        ) : changes ? (
          <>
            <MergeRequestChangeSummary
              added={changes.added.length}
              deleted={changes.deleted.length}
              modified={changes.modified.length}
            />
            <div
              style={{
                background: "var(--bg-primary)",
                padding: 16,
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                marginBottom: 24,
                maxHeight: 500,
                overflowY: "auto",
              }}
            >
              {changes.allChanges.length === 0 ? (
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--text-tertiary)",
                    textAlign: "center",
                    padding: 40,
                  }}
                >
                  No changes found
                </div>
              ) : null}
              {changes.allChanges.map((item) => (
                <MergeRequestDiffItem
                  key={`${item.id}-${item.diffType}-${item.diffSymbol}`}
                  item={item}
                />
              ))}
            </div>
            {canReview ? (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-start",
                }}
              >
                <button
                  className="mr-btn mr-btn-approve"
                  onClick={onMerge}
                  disabled={merging}
                >
                  <GitMerge size={18} />
                  {merging ? "Processing..." : "Approve & Merge"}
                </button>
                <button
                  className="mr-btn mr-btn-reject"
                  onClick={onReject}
                  disabled={merging}
                >
                  <Ban size={18} />
                  <span>Reject</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: 13,
                  padding: "10px 12px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 8,
                }}
              >
                Only the target workspace owner can approve or reject.
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
