import { Plus } from "lucide-react";
import type { DragEvent } from "react";
import { useState } from "react";

import {
  BodyType,
  FormDataItem,
  useWorkspace,
} from "../../../contexts/WorkspaceContext";
import {
  getRowDropPosition,
  readRowDragData,
  type RowDropTarget,
} from "../rowDrag";
import { reorderRows } from "../rowReorder";
import { VariableTextarea } from "../variables/VariableTextarea";
import { BodyFieldRow } from "./BodyFieldRow";

export function BodyEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [fieldDropTarget, setFieldDropTarget] = useState<RowDropTarget | null>(
    null,
  );

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

  const clearFieldDrag = () => {
    setDraggingFieldId(null);
    setFieldDropTarget(null);
  };

  const handleFieldDragOver = (
    targetId: string,
    event: DragEvent<HTMLElement>,
  ) => {
    if (!activeTab || !draggingFieldId || draggingFieldId === targetId) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setFieldDropTarget({
      id: targetId,
      position: getRowDropPosition(event),
    });
  };

  const handleFieldDrop = (targetId: string, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = draggingFieldId || readRowDragData(event);
    if (!activeTab || !sourceId || sourceId === targetId) return;

    const formData = activeTab.formData || [];
    const sourceIndex = formData.findIndex((item) => item.id === sourceId);
    const targetIndex = formData.findIndex((item) => item.id === targetId);
    updateActiveTab({
      formData: reorderRows(
        formData,
        sourceIndex,
        targetIndex,
        getRowDropPosition(event),
      ),
    });
    clearFieldDrag();
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
            <BodyFieldRow
              key={item.id}
              bodyType={currentBodyType}
              draggingId={draggingFieldId}
              dropTarget={fieldDropTarget}
              item={item}
              setDraggingId={setDraggingFieldId}
              onDelete={handleDeleteFormData}
              onDragEnd={clearFieldDrag}
              onDragOver={handleFieldDragOver}
              onDrop={handleFieldDrop}
              onUpdate={handleUpdateFormData}
            />
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
