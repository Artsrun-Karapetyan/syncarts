import { CheckSquare, Square, Trash2 } from "lucide-react";

import type { EnvironmentVariable } from "../../contexts/WorkspaceContext";
import { VariableTextInput } from "../request/VariableTextInput";

interface EnvironmentVariableRowProps {
  variable: EnvironmentVariable;
  onUpdate: (varId: string, updates: Partial<EnvironmentVariable>) => void;
  onDelete: (varId: string) => void;
}

export function EnvironmentVariableRow({
  variable,
  onUpdate,
  onDelete,
}: EnvironmentVariableRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 1fr 40px",
        gap: 0,
        alignItems: "center",
        opacity: variable.enabled === false ? 0.45 : 1,
      }}
    >
      <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: variable.enabled
              ? "var(--accent-primary)"
              : "var(--text-tertiary)",
          }}
          onClick={() => onUpdate(variable.id, { enabled: !variable.enabled })}
          title={variable.enabled ? "Disable variable" : "Enable variable"}
        >
          {variable.enabled ? <CheckSquare size={16} /> : <Square size={16} />}
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
        placeholder="Variable Key"
        value={variable.key}
        onChange={(value) => onUpdate(variable.id, { key: value })}
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
        value={variable.value}
        onChange={(value) => onUpdate(variable.id, { value })}
      />
      <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
          }}
          onClick={() => onDelete(variable.id)}
          title="Remove Variable"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
