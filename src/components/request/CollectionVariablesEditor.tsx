import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";
import { useState } from "react";

import { VariableTextInput } from "@/components/request/variables/VariableTextInput";
import { SelectionArea } from "@/components/ui/SelectionArea/SelectionArea";
import { EnvironmentVariable, useWorkspace } from "@/contexts/WorkspaceContext";

export function CollectionVariablesEditor() {
  const { activeTab, collections, updateCollection, updateFolder } =
    useWorkspace();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (
    !activeTab ||
    (activeTab.type !== "collection" && activeTab.type !== "folder")
  )
    return null;

  const activeCollection = collections.find(
    (collection) => collection.id === activeTab.collectionId,
  );

  let targetItem: any = activeCollection;
  if (activeTab.type === "folder" && activeCollection && activeTab.folderId) {
    const findFolder = (items: any[], id: string): any => {
      for (const item of items) {
        if (item.type === "folder" && item.id === id) return item;
        if (item.type === "folder" && item.items) {
          const found = findFolder(item.items, id);
          if (found) return found;
        }
      }
      return null;
    };
    targetItem =
      findFolder(activeCollection.items, activeTab.folderId) ||
      activeCollection;
  }

  const variables: EnvironmentVariable[] =
    targetItem?.variables || activeTab.variables || [];
  const updateVariables = (nextVariables: EnvironmentVariable[]) => {
    if (!activeTab.collectionId) return;
    if (activeTab.type === "folder" && activeTab.folderId) {
      updateFolder(activeTab.collectionId, activeTab.folderId, {
        variables: nextVariables,
      });
    } else {
      updateCollection(activeTab.collectionId, { variables: nextVariables });
    }
  };

  const updateVariable = (
    id: string,
    updates: Partial<EnvironmentVariable>,
  ) => {
    updateVariables(
      variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  };

  const removeVariable = (id: string) => {
    updateVariables(variables.filter((v) => v.id !== id));
  };

  const addVariable = () => {
    updateVariables([
      ...variables,
      { id: crypto.randomUUID(), key: "", value: "", enabled: true },
    ]);
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLElement>,
  ) => {
    const text = event.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return;

    event.preventDefault();

    const pastedRows = text.split("\n").filter((r) => r.trim());
    const next = [...variables];

    pastedRows.forEach((row, i) => {
      const cols = row.split("\t");
      const key = (cols[0] || "").trim();
      const value = cols[1] || "";

      if (i === 0 && next[index]) {
        next[index] = { ...next[index], key, value };
      } else {
        next.splice(index + i, 0, {
          id: crypto.randomUUID(),
          key,
          value,
          enabled: true,
        });
      }
    });

    updateVariables(next);
  };

  const handleCopy = (ids: Set<string>) => {
    const tsv = variables
      .filter((v) => ids.has(`${v.id}-key`) || ids.has(`${v.id}-value`))
      .map((v) => {
        const parts: string[] = [];
        if (ids.has(`${v.id}-key`)) parts.push(v.key || "");
        if (ids.has(`${v.id}-value`)) parts.push(v.value || "");
        return parts.join("\t");
      })
      .join("\n");

    navigator.clipboard.writeText(tsv);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          These variables are specific to this{" "}
          {activeTab.type === "folder" ? "folder" : "collection"} and its nested
          items.
        </div>
      </div>

      <div style={{ padding: "24px 32px", overflow: "auto", flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            paddingTop: 1,
            paddingLeft: 1,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 1fr 40px",
              gap: 0,
              alignItems: "center",
              background: "var(--bg-tertiary)",
              borderTop: "1px solid var(--border-color)",
              borderBottom: "1px solid var(--border-color)",
              borderLeft: "1px solid var(--border-color)",
              borderRight: "1px solid var(--border-color)",
              borderRadius: "4px 4px 0 0",
              margin: "-1px 0 0 -1px",
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            />
            <div
              style={{
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderLeft: "1px solid var(--border-color)",
              }}
            >
              Variable
            </div>
            <div
              style={{
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderLeft: "1px solid var(--border-color)",
              }}
            >
              Initial Value
            </div>
            <div
              style={{
                padding: "6px 12px",
                borderLeft: "1px solid var(--border-color)",
              }}
            />
          </div>

          <SelectionArea
            onSelectionChange={setSelectedIds}
            onCopy={handleCopy}
          >
            {variables.map((v, idx) => (
            <div
              key={v.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 40px",
                gap: 0,
                alignItems: "center",
                opacity: v.enabled === false ? 0.45 : 1,
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
                      v.enabled !== false
                        ? "var(--accent-primary)"
                        : "var(--text-tertiary)",
                  }}
                  onClick={() =>
                    updateVariable(v.id, { enabled: v.enabled === false })
                  }
                  title={
                    v.enabled === false ? "Enable variable" : "Disable variable"
                  }
                >
                  {v.enabled !== false ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </div>
              <VariableTextInput
                className="input"
                value={v.key}
                onChange={(value) => updateVariable(v.id, { key: value })}
                onPaste={(e) => handlePaste(idx, e)}
                placeholder="New Variable"
                selectionId={`${v.id}-key`}
                isSelected={selectedIds.has(`${v.id}-key`)}
                style={{
                  width: "100%",
                  fontSize: 13,
                  background: "transparent",
                  borderRadius: 0,
                  margin: "-1px 0 0 -1px",
                }}
              />
              <VariableTextInput
                className="input"
                value={v.value}
                onChange={(value) => updateVariable(v.id, { value })}
                onPaste={(e) => handlePaste(idx, e)}
                placeholder="Value"
                selectionId={`${v.id}-value`}
                isSelected={selectedIds.has(`${v.id}-value`)}
                style={{
                  width: "100%",
                  fontSize: 13,
                  background: "transparent",
                  borderRadius: 0,
                  margin: "-1px 0 0 -1px",
                }}
              />
              <div
                style={{ width: 40, display: "flex", justifyContent: "center" }}
              >
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                  }}
                  onClick={() => removeVariable(v.id)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--status-delete)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-tertiary)")
                  }
                  title="Remove Variable"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            ))}
          </SelectionArea>

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px",
              border: "1px dashed var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "all var(--transition-fast)",
              marginTop: 12,
            }}
            onClick={addVariable}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-highlight)";
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Plus size={14} /> Add Variable
          </button>
        </div>
      </div>
    </div>
  );
}
