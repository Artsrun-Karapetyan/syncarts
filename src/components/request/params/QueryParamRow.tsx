import { CheckSquare, GripVertical, Square, Trash2 } from "lucide-react";
import type { DragEvent } from "react";
import { useRef } from "react";

import type { QueryParamItem } from "../../../contexts/WorkspaceContext";
import {
  ROW_DRAG_HANDLE_STYLE,
  rowDropBackground,
  rowDropShadow,
  type RowDropTarget,
  writeRowDragData,
} from "../rowDrag";
import { VariableTextInput } from "../variables/VariableTextInput";

interface QueryParamRowProps {
  active: boolean;
  dragId: string;
  draggingId: string | null;
  dropTarget: RowDropTarget | null;
  index: number;
  param: QueryParamItem;
  selectedIds?: Set<string>;
  onDragEnd: () => void;
  onDragOver: (id: string, event: DragEvent<HTMLElement>) => void;
  onDrop: (id: string, event: DragEvent<HTMLElement>) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<QueryParamItem>) => void;
  onPaste?: (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => void;
  setDraggingId: (id: string | null) => void;
}

const inputStyle = {
  width: "100%",
  fontSize: 13,
  background: "transparent",
  borderRadius: 0,
  margin: "-1px 0 0 -1px",
};

export function QueryParamRow(props: QueryParamRowProps) {
  const isDragging = props.draggingId === props.dragId;
  const isDropTarget = props.dropTarget?.id === props.dragId;
  const rowRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={rowRef}
      style={{
        position: "relative",
        zIndex: isDragging ? 10 : isDropTarget ? 5 : 1,
        display: "grid",
        gridTemplateColumns: "52px 1fr 1fr 1fr 40px",
        gap: 0,
        alignItems: "center",
        opacity: isDragging ? 0.7 : props.param.enabled === false ? 0.45 : 1,
        background: rowDropBackground(isDropTarget),
        boxShadow:
          isDropTarget && props.dropTarget
            ? rowDropShadow(props.dropTarget.position)
            : "none",
        transition: "background 0.15s ease",
      }}
      onDragOver={(event) => props.onDragOver(props.dragId, event)}
      onDrop={(event) => props.onDrop(props.dragId, event)}
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
          draggable={props.active}
          style={{
            ...ROW_DRAG_HANDLE_STYLE,
            opacity: props.active ? 1 : 0.3,
            cursor: props.active ? "grab" : "not-allowed",
          }}
          title="Drag field"
          onDragStart={(event) => {
            props.setDraggingId(props.dragId);
            writeRowDragData(event, props.dragId, rowRef.current);
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
            color:
              props.param.enabled !== false
                ? "var(--accent-primary)"
                : "var(--text-tertiary)",
          }}
          onClick={() =>
            props.onUpdate(props.index, {
              enabled: props.param.enabled === false,
            })
          }
          title={
            props.param.enabled === false ? "Enable param" : "Disable param"
          }
        >
          {props.param.enabled !== false ? (
            <CheckSquare size={15} />
          ) : (
            <Square size={15} />
          )}
        </button>
      </div>
      <VariableTextInput
        className="input"
        style={inputStyle}
        placeholder="Key"
        value={props.param.key}
        onChange={(value) => props.onUpdate(props.index, { key: value })}
        onPaste={(e) => props.onPaste?.(props.index, e)}
        selectionId={`${props.dragId}-key`}
        isSelected={props.selectedIds?.has(`${props.dragId}-key`)}
        disabled={!props.active}
      />
      <VariableTextInput
        className="input"
        style={inputStyle}
        placeholder="Value"
        value={props.param.value}
        onChange={(value) => props.onUpdate(props.index, { value })}
        onPaste={(e) => props.onPaste?.(props.index, e)}
        selectionId={`${props.dragId}-value`}
        isSelected={props.selectedIds?.has(`${props.dragId}-value`)}
        disabled={!props.active}
      />
      <VariableTextInput
        className="input"
        style={inputStyle}
        placeholder="Description"
        value={props.param.description || ""}
        onChange={(value) =>
          props.onUpdate(props.index, { description: value })
        }
        onPaste={(e) => props.onPaste?.(props.index, e)}
        selectionId={`${props.dragId}-description`}
        isSelected={props.selectedIds?.has(`${props.dragId}-description`)}
        disabled={!props.active}
      />
      <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            cursor: props.active ? "pointer" : "not-allowed",
            color: "var(--text-tertiary)",
            opacity: props.active ? 1 : 0.3,
          }}
          onClick={() => {
            if (props.active) props.onRemove(props.index);
          }}
          onMouseEnter={(event) => {
            if (props.active)
              event.currentTarget.style.color = "var(--status-delete)";
          }}
          onMouseLeave={(event) => {
            if (props.active)
              event.currentTarget.style.color = "var(--text-tertiary)";
          }}
          title="Remove Param"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
