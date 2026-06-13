import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { VariableTextInput } from "./variables/VariableTextInput";

export function HeadersEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const headers = activeTab?.headers || [];

  const updateHeader = (
    index: number,
    updates: Partial<(typeof headers)[number]>,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], ...updates };
    updateActiveTab({ headers: newHeaders });
  };

  const addHeader = () => {
    updateActiveTab({
      headers: [...headers, { key: "", value: "", enabled: true }],
    });
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    if (newHeaders.length === 0)
      newHeaders.push({ key: "", value: "", enabled: true });
    updateActiveTab({ headers: newHeaders });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        paddingTop: 1,
        paddingLeft: 1,
      }}
    >
      {headers.map((header, idx) => (
        <div
          key={`${header.key}-${header.value}-${header.description ?? ""}-${header.enabled ?? true}`}
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 1fr 1fr 40px",
            gap: 0,
            alignItems: "center",
            opacity: header.enabled === false ? 0.45 : 1,
          }}
        >
          <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color:
                  header.enabled !== false
                    ? "var(--accent-primary)"
                    : "var(--text-tertiary)",
              }}
              onClick={() =>
                updateHeader(idx, { enabled: header.enabled === false })
              }
              title={
                header.enabled === false ? "Enable header" : "Disable header"
              }
            >
              {header.enabled !== false ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} />
              )}
            </button>
          </div>
          <VariableTextInput
            className="input"
            style={{
              width: "100%",
              fontSize: 13,
              background: "transparent",
              borderRadius: 0,
              margin: "-1px 0 0 -1px",
            }}
            placeholder="Key (e.g. Authorization)"
            value={header.key}
            onChange={(value) => updateHeader(idx, { key: value })}
            disabled={!activeTab}
          />
          <VariableTextInput
            className="input"
            style={{
              width: "100%",
              fontSize: 13,
              background: "transparent",
              borderRadius: 0,
              margin: "-1px 0 0 -1px",
            }}
            placeholder="Value"
            value={header.value}
            onChange={(value) => updateHeader(idx, { value })}
            disabled={!activeTab}
          />
          <VariableTextInput
            className="input"
            style={{
              width: "100%",
              fontSize: 13,
              background: "transparent",
              borderRadius: 0,
              margin: "-1px 0 0 -1px",
            }}
            placeholder="Description"
            value={header.description || ""}
            onChange={(value) => updateHeader(idx, { description: value })}
            disabled={!activeTab}
          />
          <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: activeTab ? "pointer" : "not-allowed",
                color: "var(--text-tertiary)",
                opacity: activeTab ? 1 : 0.3,
              }}
              onClick={() => {
                if (activeTab) removeHeader(idx);
              }}
              onMouseEnter={(e) => {
                if (activeTab)
                  e.currentTarget.style.color = "var(--status-delete)";
              }}
              onMouseLeave={(e) => {
                if (activeTab)
                  e.currentTarget.style.color = "var(--text-tertiary)";
              }}
              title="Remove Header"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 0",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-tertiary)",
          border: "1px dashed var(--border-highlight)",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          cursor: activeTab ? "pointer" : "not-allowed",
          transition: "all var(--transition-fast)",
          opacity: activeTab ? 1 : 0.4,
        }}
        onClick={() => {
          if (activeTab) addHeader();
        }}
        onMouseEnter={(e) => {
          if (!activeTab) return;
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.borderColor = "var(--text-tertiary)";
          e.currentTarget.style.background = "var(--bg-glass)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-tertiary)";
          e.currentTarget.style.borderColor = "var(--border-highlight)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <Plus size={15} /> Add Header
      </button>
    </div>
  );
}
