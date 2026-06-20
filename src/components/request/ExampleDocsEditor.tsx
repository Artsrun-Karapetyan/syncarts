import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { useState } from "react";

import type { SavedExample } from "@/contexts/workspace/core/types";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Props {
  example: SavedExample;
  requestId: string;
  collectionId: string;
}

const jsonTheme = {
  ...darkTheme,
  "--w-rjv-background-color": "transparent",
  "--w-rjv-color": "#e2e8f0",
  "--w-rjv-key-string": "#6366f1",
  "--w-rjv-key-number": "#6366f1",
  "--w-rjv-colon-color": "#64748b",
  "--w-rjv-type-string-color": "#10b981",
  "--w-rjv-type-int-color": "#f59e0b",
  "--w-rjv-type-float-color": "#f59e0b",
  "--w-rjv-type-boolean-color": "#ef4444",
  "--w-rjv-type-null-color": "#64748b",
  "--w-rjv-line-color": "rgba(255, 255, 255, 0.08)",
  "--w-rjv-arrow-color": "#64748b",
};

export function ExampleDocsEditor({ example, requestId, collectionId }: Props) {
  const { updateExample } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(example.body || "");

  const parsedBody = (() => {
    try {
      return JSON.parse(example.body);
    } catch {
      return null;
    }
  })();

  const handleSave = () => {
    updateExample(collectionId, requestId, example.id, { body: editBody });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditBody(example.body || "");
    setIsEditing(false);
  };

  const statusColor =
    example.code >= 200 && example.code < 300
      ? "#22c55e"
      : example.code >= 400
        ? "#ef4444"
        : "#eab308";

  const statusBg =
    example.code >= 200 && example.code < 300
      ? "rgba(34,197,94,0.12)"
      : example.code >= 400
        ? "rgba(239,68,68,0.12)"
        : "rgba(234,179,8,0.12)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-color)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 4,
              background: statusBg,
              color: statusColor,
            }}
          >
            {example.code}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Response Body
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {isEditing ? (
            <>
              <button
                className="btn"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={handleSave}
              >
                Save
              </button>
            </>
          ) : (
            <button
              className="btn"
              style={{ padding: "4px 10px", fontSize: 11 }}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {isEditing ? (
          <textarea
            className="input"
            style={{
              width: "100%",
              height: "100%",
              minHeight: 200,
              padding: 12,
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              resize: "none",
              lineHeight: 1.5,
              tabSize: 2,
            }}
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            spellCheck={false}
          />
        ) : parsedBody ? (
          <div
            style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}
            className="json-view-container"
          >
            <JsonView
              value={parsedBody}
              style={jsonTheme}
              displayDataTypes={false}
              displayObjectSize={false}
              enableClipboard={false}
              collapsed={2}
              shortenTextAfterLength={0}
            />
          </div>
        ) : (
          <pre
            style={{
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {example.body || "Empty response"}
          </pre>
        )}
      </div>
    </div>
  );
}
