import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";

import {
  EnvironmentVariable,
  useWorkspace,
} from "../../contexts/WorkspaceContext";
import { VariableTextInput } from "./variables/VariableTextInput";

export function CollectionVariablesEditor() {
  const { activeTab, collections, updateCollection, updateFolder } =
    useWorkspace();

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

          {variables.map((v) => (
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
                placeholder="New Variable"
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
                placeholder="Value"
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
