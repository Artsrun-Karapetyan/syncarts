import { CheckSquare, GripVertical, Square, Trash2 } from "lucide-react";
import type { DragEvent } from "react";
import { useRef } from "react";

import type {
  BodyType,
  FormDataItem,
} from "../../../contexts/WorkspaceContext";
import { Select } from "../../ui/Select";
import {
  ROW_DRAG_HANDLE_STYLE,
  rowDropBackground,
  rowDropShadow,
  type RowDropTarget,
  writeRowDragData,
} from "../rowDrag";
import { VariableTextInput } from "../variables/VariableTextInput";
import { FileValueEditor } from "./FileValueEditor";

interface BodyFieldRowProps {
  bodyType: BodyType;
  draggingId: string | null;
  dropTarget: RowDropTarget | null;
  item: FormDataItem;
  selectedIds?: Set<string>;
  onDelete: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (id: string, event: DragEvent<HTMLElement>) => void;
  onDrop: (id: string, event: DragEvent<HTMLElement>) => void;
  onUpdate: (id: string, updates: Partial<FormDataItem>) => void;
  onPaste?: (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => void;
  index: number;
  setDraggingId: (id: string | null) => void;
}

const inputStyle = {
  width: "100%",
  fontSize: 13,
  background: "transparent",
  borderRadius: 0,
  margin: "-1px 0 0 -1px",
};

export function BodyFieldRow(props: BodyFieldRowProps) {
  const isDragging = props.draggingId === props.item.id;
  const isDropTarget = props.dropTarget?.id === props.item.id;
  const rowRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={rowRef}
      style={{
        position: "relative",
        zIndex: isDragging ? 10 : isDropTarget ? 5 : 1,
        display: "grid",
        gridTemplateColumns: "52px 1fr 1fr 1fr 40px",
        alignItems: "center",
        gap: 0,
        marginBottom: 0,
        opacity: isDragging ? 0.7 : props.item.enabled === false ? 0.45 : 1,
        background: rowDropBackground(isDropTarget),
        boxShadow:
          isDropTarget && props.dropTarget
            ? rowDropShadow(props.dropTarget.position)
            : "none",
        transition: "background 0.15s ease",
      }}
      onDragOver={(event) => props.onDragOver(props.item.id, event)}
      onDrop={(event) => props.onDrop(props.item.id, event)}
    >
      <div
        style={{
          width: 52,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span
          draggable
          style={ROW_DRAG_HANDLE_STYLE}
          title="Drag field"
          onDragStart={(event) => {
            props.setDraggingId(props.item.id);
            writeRowDragData(event, props.item.id, rowRef.current);
          }}
          onDragEnd={props.onDragEnd}
        >
          <GripVertical size={14} />
        </span>
        <button
          style={{
            background: "none",
            border: "none",
            width: 20,
            height: 24,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: props.item.enabled
              ? "var(--accent-primary)"
              : "var(--text-tertiary)",
          }}
          onClick={() =>
            props.onUpdate(props.item.id, { enabled: !props.item.enabled })
          }
        >
          {props.item.enabled ? (
            <CheckSquare size={15} />
          ) : (
            <Square size={15} />
          )}
        </button>
      </div>
      <div style={{ position: "relative", display: "flex", minWidth: 0 }}>
        <VariableTextInput
          className="input"
          style={{
            ...inputStyle,
            paddingRight: props.bodyType === "form-data" ? 80 : undefined,
          }}
          placeholder="Key"
          value={props.item.key}
          onChange={(value) => props.onUpdate(props.item.id, { key: value })}
          onPaste={(e) => props.onPaste?.(props.index, e)}
          selectionId={`${props.item.id}-key`}
          isSelected={props.selectedIds?.has(`${props.item.id}-key`)}
        />
        {props.bodyType === "form-data" && (
          <div
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Select
              value={props.item.type || "text"}
              options={[
                { value: "text", label: "Text" },
                { value: "file", label: "File" },
              ]}
              onChange={(value) =>
                props.onUpdate(props.item.id, {
                  type: value as "text" | "file",
                })
              }
              variant="ghost"
              style={{ minWidth: 70 }}
            />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
        {props.item.type === "file" ? (
          <FileValueEditor
            item={props.item}
            handleUpdateFormData={props.onUpdate}
          />
        ) : (
          <VariableTextInput
            className="input"
            style={inputStyle}
            placeholder="Value"
            value={props.item.value}
            onChange={(value) => props.onUpdate(props.item.id, { value })}
            onPaste={(e) => props.onPaste?.(props.index, e)}
            selectionId={`${props.item.id}-value`}
            isSelected={props.selectedIds?.has(`${props.item.id}-value`)}
          />
        )}
      </div>
      <VariableTextInput
        className="input"
        style={inputStyle}
        placeholder="Description"
        value={props.item.description || ""}
        onChange={(description) =>
          props.onUpdate(props.item.id, { description })
        }
        onPaste={(e) => props.onPaste?.(props.index, e)}
        selectionId={`${props.item.id}-description`}
        isSelected={props.selectedIds?.has(`${props.item.id}-description`)}
      />
      <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
          }}
          onClick={() => props.onDelete(props.item.id)}
          onMouseEnter={(event) =>
            (event.currentTarget.style.color = "var(--status-delete)")
          }
          onMouseLeave={(event) =>
            (event.currentTarget.style.color = "var(--text-tertiary)")
          }
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
