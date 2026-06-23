import "@/components/request/health/CollectionHealthIssueRow.css";

import { AlertTriangle, ChevronRight, ExternalLink } from "lucide-react";

import type { HealthRequestLocation } from "@/components/request/health/collectionHealthRequestLocations";
import type { CollectionHealthIssue } from "@/components/request/health/collectionHealthTypes";
import { getCollectionHealthIssueTargetTab } from "@/components/request/health/getCollectionHealthIssueTargetTab";

interface Props {
  collectionId: string;
  issue: CollectionHealthIssue;
  locations: Map<string, HealthRequestLocation>;
  onOpenRequest: (
    collectionId: string,
    folderId: string | null,
    requestId: string,
  ) => void;
}

export function CollectionHealthIssueRow(props: Props) {
  const { collectionId, issue, locations, onOpenRequest } = props;
  const targetTab = getCollectionHealthIssueTargetTab(issue.code);

  return (
    <details className="collection-health-issue">
      <summary className="collection-health-issue__summary">
        <ChevronRight className="collection-health-issue__chevron" size={14} />
        <AlertTriangle
          size={15}
          style={{ color: issue.severity === "error" ? "#ef4444" : "#eab308" }}
        />
        <span className="collection-health-issue__label">{issue.label}</span>
        <span className="collection-health-issue__count">{issue.count}</span>
      </summary>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginTop: 8,
          maxHeight: 240,
          overflow: "auto",
          paddingLeft: 22,
        }}
      >
        {issue.requests.map((request) => {
          const location = locations.get(request.id);
          return (
            <button
              key={`${issue.code}:${request.id}`}
              type="button"
              className="btn"
              onClick={() => {
                onOpenRequest(
                  collectionId,
                  location?.folderId || null,
                  request.id,
                );
                if (targetTab) {
                  requestAnimationFrame(() => {
                    window.dispatchEvent(
                      new CustomEvent("syncarts:open-request-tab", {
                        detail: { tab: targetTab },
                      }),
                    );
                  });
                }
              }}
              style={{
                alignItems: "center",
                display: "flex",
                fontSize: 12,
                gap: 8,
                justifyContent: "space-between",
                padding: "6px 8px",
                width: "100%",
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textAlign: "left",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {location?.folderPath ? `${location.folderPath} / ` : ""}
                {request.name}
              </span>
              <ExternalLink size={12} style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </details>
  );
}
