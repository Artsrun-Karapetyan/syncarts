import { FileText } from "lucide-react";

import type { SavedRequest } from "../../../contexts/workspace/core/types";

interface Props {
  request: SavedRequest;
  level: number;
}

export function RequestExamplesList({ request, level }: Props) {
  if (!request.examples || request.examples.length === 0) return null;

  return (
    <div style={{ marginLeft: level * 16 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginTop: 12,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            marginRight: 6,
          }}
        >
          {request.method}
        </span>
        {request.name}
      </div>
      {request.examples.map((example) => (
        <div
          key={example.id}
          style={{
            marginLeft: 16,
            padding: "8px 12px",
            marginTop: 4,
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <FileText size={12} style={{ color: "var(--text-tertiary)" }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {example.name}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background:
                  example.code >= 200 && example.code < 300
                    ? "rgba(34,197,94,0.12)"
                    : example.code >= 400
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(234,179,8,0.12)",
                color:
                  example.code >= 200 && example.code < 300
                    ? "#22c55e"
                    : example.code >= 400
                      ? "#ef4444"
                      : "#eab308",
              }}
            >
              {example.code}
            </span>
          </div>
          {example.originalRequest?.url && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                fontFamily: "monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {`${example.originalRequest.method || "GET"} ${example.originalRequest.url}`}
            </div>
          )}
          {example.body && (
            <pre
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                marginTop: 6,
                padding: "6px 8px",
                borderRadius: 4,
                background: "var(--bg-secondary)",
                overflow: "auto",
                maxHeight: 80,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {example.body.length > 200
                ? `${example.body.slice(0, 200)}...`
                : example.body}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
