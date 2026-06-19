import { Activity, CheckCircle2 } from "lucide-react";

import type { Collection } from "../../../contexts/WorkspaceContext";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { analyzeCollectionHealth } from "./collectionHealthAnalyzer";
import { CollectionHealthIssueRow } from "./CollectionHealthIssueRow";
import { CollectionHealthMetricCard } from "./CollectionHealthMetricCard";
import { getCollectionHealthRequestLocations } from "./collectionHealthRequestLocations";
import { getCollectionHealthLabel } from "./getCollectionHealthLabel";
import { getCollectionHealthScoreColor } from "./getCollectionHealthScoreColor";

interface Props {
  collection: Collection;
}

export function CollectionHealthReport({ collection }: Props) {
  const { openRequestTab } = useWorkspace();
  const report = analyzeCollectionHealth(collection);
  const locations = getCollectionHealthRequestLocations(collection);
  const scoreColor = getCollectionHealthScoreColor(report.score);

  return (
    <section style={{ marginTop: 24 }}>
      <div
        style={{
          alignItems: "center",
          color: "var(--text-tertiary)",
          display: "flex",
          fontSize: 12,
          fontWeight: 700,
          gap: 8,
          letterSpacing: "0.05em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        <Activity size={14} style={{ color: scoreColor }} />
        Collection Health
      </div>
      <div
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          padding: 18,
        }}
      >
        <div
          style={{
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            gap: 16,
            paddingBottom: 16,
          }}
        >
          <div
            style={{
              color: scoreColor,
              fontSize: 42,
              fontWeight: 700,
              lineHeight: 1,
              minWidth: 92,
            }}
          >
            {report.score}%
          </div>
          <div>
            <div
              style={{
                color: "var(--text-primary)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {getCollectionHealthLabel(report.score)}
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {report.requestCount} requests checked, {report.issues.length}{" "}
              warning types found
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            marginTop: 14,
          }}
        >
          <CollectionHealthMetricCard
            label="With examples"
            value={`${report.requestsWithExamples}/${report.requestCount}`}
          />
          <CollectionHealthMetricCard
            label="With tests"
            value={`${report.requestsWithTests}/${report.requestCount}`}
          />
          <CollectionHealthMetricCard
            label="With docs"
            value={`${report.documentedRequests}/${report.requestCount}`}
          />
          <CollectionHealthMetricCard
            label="Duplicate groups"
            value={report.duplicateGroups}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          {report.issues.length === 0 ? (
            <div
              style={{
                alignItems: "center",
                color: "var(--status-success)",
                display: "flex",
                fontSize: 13,
                gap: 8,
              }}
            >
              <CheckCircle2 size={14} />
              No health warnings
            </div>
          ) : (
            report.issues.map((issue) => (
              <CollectionHealthIssueRow
                key={issue.code}
                collectionId={collection.id}
                issue={issue}
                locations={locations}
                onOpenRequest={openRequestTab}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
