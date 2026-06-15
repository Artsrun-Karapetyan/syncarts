import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { formatDiffValue, type MergeRequestDiffItem as DiffItem } from "./mergeRequestDiff";
import { MergeRequestFolderBadge } from "./MergeRequestFolderBadge";
import { MergeRequestMethodBadge } from "./MergeRequestMethodBadge";

interface MergeRequestDiffItemProps {
  item: DiffItem;
}

export function MergeRequestDiffItem({ item }: MergeRequestDiffItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isExpandable =
    item.diffType === "modified" &&
    item.changedKeys &&
    item.changedKeys.length > 0;

  return (
    <div
      style={{
        marginBottom: 8,
        background: "var(--bg-secondary)",
        borderRadius: 8,
        border: `1px solid ${item.diffColor}33`,
        borderLeft: `4px solid ${item.diffColor}`,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => isExpandable && setExpanded(!expanded)}
        style={{
          fontSize: 14,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          cursor: isExpandable ? "pointer" : "default",
          userSelect: "none",
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
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
            {expanded ? (
              <ChevronDown
                size={16}
                style={{ color: "var(--text-tertiary)", marginLeft: 8 }}
              />
            ) : (
              <ChevronRight
                size={16}
                style={{ color: "var(--text-tertiary)", marginLeft: 8 }}
              />
            )}
          </div>
        )}
      </div>

      {expanded && isExpandable && (
        <div
          style={{
            padding: "16px 24px",
            background: "rgba(0,0,0,0.1)",
            borderTop: `1px solid ${item.diffColor}22`,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {item.changedKeys?.map((key) => (
            <div
              key={key}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                {key}
              </div>
              <div
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    flex: 1,
                    background: "rgba(255, 80, 80, 0.05)",
                    padding: 12,
                    borderRadius: 6,
                    border: "1px solid rgba(255, 80, 80, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#ff5050",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    OLD VALUE
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {formatDiffValue(
                      item.originalItem?.[
                        key as keyof typeof item.originalItem
                      ],
                    )}
                  </pre>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "rgba(0, 255, 170, 0.05)",
                    padding: 12,
                    borderRadius: 6,
                    border: "1px solid rgba(0, 255, 170, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#00ffaa",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    NEW VALUE
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {formatDiffValue((item as any)[key])}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
