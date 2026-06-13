import type { MergeRequestDiffItem as DiffItem } from "./mergeRequestDiff";
import { MergeRequestFolderBadge } from "./MergeRequestFolderBadge";
import { MergeRequestMethodBadge } from "./MergeRequestMethodBadge";

interface MergeRequestDiffItemProps {
  item: DiffItem;
}

export function MergeRequestDiffItem({ item }: MergeRequestDiffItemProps) {
  return (
    <div
      style={{
        fontSize: 14,
        color: "var(--text-primary)",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--bg-secondary)",
        padding: "10px 16px",
        borderRadius: 8,
        border: `1px solid ${item.diffColor}33`,
        borderLeft: `4px solid ${item.diffColor}`,
      }}
    >
      <span
        style={{
          color: item.diffColor,
          fontWeight: 800,
          width: 14,
          textAlign: "center",
          fontSize: 16,
        }}
      >
        {item.diffSymbol}
      </span>
      {item.type === "folder" ? (
        <MergeRequestFolderBadge />
      ) : (
        <MergeRequestMethodBadge method={item.method} />
      )}
      <span
        style={{
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {item.name || item.url || "Untitled Request"}
      </span>
      {item.diffType === "modified" && item.changedKeys && (
        <div style={{ display: "flex", gap: 6 }}>
          {item.changedKeys.map((key) => (
            <span
              key={key}
              style={{
                fontSize: 10,
                padding: "2px 8px",
                background: "rgba(255, 170, 0, 0.15)",
                color: "#ffaa00",
                borderRadius: 12,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {key === "queryParams" ? "Query" : key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
