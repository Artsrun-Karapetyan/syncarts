import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";

import {
  BodyType,
  FormDataItem,
  useWorkspace,
} from "../../../contexts/WorkspaceContext";
import { Select } from "../../ui/Select";
import { VariableTextarea } from "../variables/VariableTextarea";
import { VariableTextInput } from "../variables/VariableTextInput";
import { FileValueEditor } from "./FileValueEditor";

export function BodyEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();

  const currentBodyType = activeTab?.bodyType || "raw";

  const handleTypeChange = (type: BodyType) => {
    updateActiveTab({ bodyType: type });
  };

  const handleUpdateFormData = (id: string, updates: Partial<FormDataItem>) => {
    if (!activeTab) return;
    const newData = (activeTab.formData || []).map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );
    updateActiveTab({ formData: newData });
  };

  const handleAddFormData = () => {
    if (!activeTab) return;
    const newData = [
      ...(activeTab.formData || []),
      {
        id: crypto.randomUUID(),
        key: "",
        value: "",
        enabled: true,
        type: "text" as const,
      },
    ];
    updateActiveTab({ formData: newData });
  };

  const handleDeleteFormData = (id: string) => {
    if (!activeTab) return;
    const newData = (activeTab.formData || []).filter((item) => item.id !== id);
    updateActiveTab({ formData: newData });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Body Type Selector */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {(
          ["none", "form-data", "x-www-form-urlencoded", "raw"] as BodyType[]
        ).map((type) => (
          <label
            key={type}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              cursor: "pointer",
              color:
                currentBodyType === type
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
            }}
          >
            <input
              type="radio"
              name="bodyType"
              checked={currentBodyType === type}
              onChange={() => handleTypeChange(type)}
              style={{
                accentColor: "var(--accent-primary)",
                cursor: "pointer",
              }}
            />
            {type === "none"
              ? "none"
              : type === "form-data"
                ? "form-data"
                : type === "x-www-form-urlencoded"
                  ? "x-www-form-urlencoded"
                  : "raw"}
          </label>
        ))}
      </div>

      {currentBodyType === "none" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            fontSize: 13,
          }}
        >
          This request does not have a body
        </div>
      )}

      {currentBodyType === "raw" && (
        <VariableTextarea
          className="input font-mono"
          style={{
            flex: 1,
            minHeight: 200,
            resize: "none",
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
            background: "var(--bg-primary)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-color)",
          }}
          placeholder={'{\n  "key": "value"\n}'}
          value={activeTab?.body || ""}
          onChange={(value) => updateActiveTab({ body: value })}
          disabled={!activeTab}
        />
      )}

      {(currentBodyType === "form-data" ||
        currentBodyType === "x-www-form-urlencoded") && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            paddingTop: 1,
            paddingLeft: 1,
          }}
        >
          {(activeTab?.formData || []).map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 1fr 40px",
                alignItems: "center",
                gap: 0,
                marginBottom: 0,
                opacity: item.enabled === false ? 0.45 : 1,
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
                    color: item.enabled
                      ? "var(--accent-primary)"
                      : "var(--text-tertiary)",
                  }}
                  onClick={() =>
                    handleUpdateFormData(item.id, { enabled: !item.enabled })
                  }
                >
                  {item.enabled ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </div>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                <VariableTextInput
                  className="input"
                  style={{
                    width: "100%",
                    fontSize: 13,
                    background: "transparent",
                    paddingRight:
                      currentBodyType === "form-data" ? 60 : undefined,
                    borderRadius: 0,
                    margin: "-1px 0 0 -1px",
                  }}
                  placeholder="Key"
                  value={item.key}
                  onChange={(value) =>
                    handleUpdateFormData(item.id, { key: value })
                  }
                />
                {currentBodyType === "form-data" && (
                  <div
                    style={{
                      position: "absolute",
                      right: 4,
                      zIndex: 5,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Select
                      value={item.type || "text"}
                      options={[
                        { value: "text", label: "Text" },
                        { value: "file", label: "File" },
                      ]}
                      onChange={(val) =>
                        handleUpdateFormData(item.id, {
                          type: val as "text" | "file",
                        })
                      }
                      variant="ghost"
                      style={{ minWidth: 70 }}
                    />
                  </div>
                )}
              </div>
              <div
                style={{ display: "flex", alignItems: "center", minWidth: 0 }}
              >
                {item.type === "file" ? (
                  <FileValueEditor
                    item={item}
                    handleUpdateFormData={handleUpdateFormData}
                  />
                ) : (
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
                    value={item.value}
                    onChange={(value) =>
                      handleUpdateFormData(item.id, { value })
                    }
                  />
                )}
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
                placeholder="Description"
                value={item.description || ""}
                onChange={(description) =>
                  handleUpdateFormData(item.id, { description })
                }
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
                  onClick={() => handleDeleteFormData(item.id)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--status-delete)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-tertiary)")
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <button
            className="btn"
            style={{ alignSelf: "flex-start", marginTop: 8 }}
            onClick={handleAddFormData}
          >
            <Plus size={14} />
            Add Field
          </button>
        </div>
      )}
    </div>
  );
}
