import { VariableTextInput } from "@/components/request/variables/VariableTextInput";
import type { PathVariable } from "@/contexts/WorkspaceContext";

interface PathVariableRowProps {
  active: boolean;
  variable: PathVariable;
  onUpdate: (id: string, data: Partial<PathVariable>) => void;
}

const inputStyle = {
  width: "100%",
  fontSize: 13,
  background: "transparent",
  borderRadius: 0,
  margin: "-1px 0 0 -1px",
};

export function PathVariableRow(props: PathVariableRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "52px 1fr 1fr 1fr 40px",
        gap: 0,
        alignItems: "center",
      }}
    >
      <div style={{ width: 52 }} />
      <input
        className="input"
        style={{
          ...inputStyle,
          color: "var(--text-secondary)",
        }}
        value={props.variable.key}
        disabled
      />
      <VariableTextInput
        className="input"
        style={inputStyle}
        placeholder="Value"
        value={props.variable.value}
        onChange={(value) => props.onUpdate(props.variable.id, { value })}
        disabled={!props.active}
      />
      <VariableTextInput
        className="input"
        style={inputStyle}
        placeholder="Description"
        value={props.variable.description || ""}
        onChange={(value) =>
          props.onUpdate(props.variable.id, { description: value })
        }
        disabled={!props.active}
      />
      <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
        <span style={{ color: "var(--text-tertiary)", textAlign: "center" }}>
          ...
        </span>
      </div>
    </div>
  );
}
