import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { syncRowKeys } from "@/components/request/rowKeys";
import { VariableTextInput } from "@/components/request/variables/VariableTextInput";
import { SelectionArea } from "@/components/ui/SelectionArea/SelectionArea";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function HeadersEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const headers = activeTab?.headers || [];
  const rowKeysRef = useRef<string[]>([]);
  const rowKeys = syncRowKeys(rowKeysRef.current, headers.length);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const updateHeader = (
    index: number,
    updates: Partial<(typeof headers)[number]>,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], ...updates };
    updateActiveTab({ headers: newHeaders });
  };

  const addHeader = () => {
    rowKeysRef.current.push(crypto.randomUUID());
    updateActiveTab({
      headers: [...headers, { key: "", value: "", enabled: true }],
    });
  };

  const removeHeader = (index: number) => {
    rowKeysRef.current.splice(index, 1);
    const newHeaders = headers.filter((_, i) => i !== index);
    if (newHeaders.length === 0)
      newHeaders.push({ key: "", value: "", enabled: true });
    updateActiveTab({ headers: newHeaders });
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const text = event.clipboardData.getData("text");
    if (
      !text ||
      (!text.includes("\t") && !text.includes("\n") && !text.includes(": "))
    )
      return;

    event.preventDefault();

    const pastedRows = text.split("\n").filter((r) => r.trim());
    const newHeaders = [...headers];

    pastedRows.forEach((row, i) => {
      let key: string;
      let value = "";
      let description = "";

      if (row.includes("\t")) {
        let cols = row.split("\t");
        if (cols.length > 3 && cols[0].trim() === "") {
          cols = cols.slice(1);
        }
        key = cols[0] || "";
        value = cols[1] || "";
        description = cols[2] || "";
      } else if (row.includes(": ")) {
        const parts = row.split(": ");
        key = parts[0];
        value = parts.slice(1).join(": ");
      } else {
        key = row;
      }

      const header = { key, value, description, enabled: true };

      if (i === 0 && newHeaders[index]) {
        newHeaders[index] = { ...newHeaders[index], ...header };
      } else {
        newHeaders.splice(index + i, 0, header);
        rowKeysRef.current.splice(index + i, 0, crypto.randomUUID());
      }
    });

    updateActiveTab({ headers: newHeaders });
  };

  const handleCopy = (ids: Set<string>) => {
    const selectedHeaders = headers.filter(
      (_, i) =>
        ids.has(`${rowKeys[i]}-key`) ||
        ids.has(`${rowKeys[i]}-value`) ||
        ids.has(`${rowKeys[i]}-description`),
    );
    if (selectedHeaders.length === 0) return;

    const tsv = selectedHeaders
      .map((h) => {
        const id = rowKeys[headers.indexOf(h)];
        const parts = [];
        if (ids.has(`${id}-key`)) parts.push(h.key || "");
        if (ids.has(`${id}-value`)) parts.push(h.value || "");
        if (ids.has(`${id}-description`)) parts.push(h.description || "");
        return parts.join("\t");
      })
      .join("\n");

    navigator.clipboard.writeText(tsv);
  };

  return (
    <SelectionArea onSelectionChange={setSelectedIds} onCopy={handleCopy}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          paddingTop: 1,
          paddingLeft: 1,
        }}
      >
        {headers.map((header, idx) => {
          return (
            <div
              key={rowKeys[idx]}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 1fr 40px",
                gap: 0,
                alignItems: "center",
                opacity: header.enabled === false ? 0.45 : 1,
              }}
            >
              <div
                style={{ width: 40, display: "flex", justifyContent: "center" }}
              >
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
                    header.enabled === false
                      ? "Enable header"
                      : "Disable header"
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
                onPaste={(e) => handlePaste(idx, e)}
                selectionId={`${rowKeys[idx]}-key`}
                isSelected={selectedIds.has(`${rowKeys[idx]}-key`)}
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
                onPaste={(e) => handlePaste(idx, e)}
                selectionId={`${rowKeys[idx]}-value`}
                isSelected={selectedIds.has(`${rowKeys[idx]}-value`)}
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
                onPaste={(e) => handlePaste(idx, e)}
                selectionId={`${rowKeys[idx]}-description`}
                isSelected={selectedIds.has(`${rowKeys[idx]}-description`)}
                disabled={!activeTab}
              />
              <div
                style={{ width: 40, display: "flex", justifyContent: "center" }}
              >
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
          );
        })}

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
    </SelectionArea>
  );
}
