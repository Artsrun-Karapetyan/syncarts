import { CheckSquare, Copy, Eye, EyeOff, Square, Trash2 } from "lucide-react";
import { useState } from "react";

import { VariableTextInput } from "@/components/request/variables/VariableTextInput";
import type { EnvironmentVariable } from "@/contexts/WorkspaceContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

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
  const { secrets, updateSecret } = useWorkspace();
  const [revealed, setRevealed] = useState(false);
  const isSecret = variable.type === "secret";

  const handleValueChange = (val: string) => {
    if (isSecret) {
      updateSecret(variable.id, val);
    } else {
      onUpdate(variable.id, { value: val });
    }
  };

  const displayValue = isSecret ? secrets[variable.id] || "" : variable.value;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 1fr 100px 40px",
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
      <div
        style={{
          position: "relative",
          width: "100%",
          margin: "-1px 0 0 -1px",
          display: "flex",
          border: "1px solid var(--border-color)",
        }}
      >
        {isSecret && !revealed ? (
          <input
            type="password"
            className="input"
            style={{
              width: "100%",
              fontSize: 13,
              background: "transparent",
              borderRadius: 0,
              border: "none",
            }}
            placeholder="Secret Value"
            value={displayValue}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        ) : (
          <VariableTextInput
            className="input"
            style={{
              width: "100%",
              fontSize: 13,
              background: "transparent",
              borderRadius: 0,
              border: "none",
            }}
            placeholder="Value"
            value={displayValue}
            onChange={handleValueChange}
          />
        )}
        {isSecret && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 8px",
              gap: 6,
            }}
          >
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary)",
              }}
              onClick={() => setRevealed(!revealed)}
              title={revealed ? "Hide Value" : "Reveal Value"}
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary)",
              }}
              onClick={() => navigator.clipboard.writeText(displayValue)}
              title="Copy Value"
            >
              <Copy size={14} />
            </button>
          </div>
        )}
      </div>
      <div style={{ width: "100%", margin: "-1px 0 0 -1px" }}>
        <select
          className="input"
          style={{
            width: "100%",
            height: "100%",
            fontSize: 13,
            background: "transparent",
            borderRadius: 0,
          }}
          value={variable.type || "default"}
          onChange={(e) => {
            const newType = e.target.value as "default" | "secret";
            if (newType === "secret" && variable.type !== "secret") {
              // moving to secret: clear workspace value, move to vault
              updateSecret(variable.id, variable.value);
              onUpdate(variable.id, { type: "secret", value: "" });
            } else if (newType === "default" && variable.type === "secret") {
              // moving from secret to default: move value to workspace
              onUpdate(variable.id, {
                type: "default",
                value: secrets[variable.id] || "",
              });
            }
          }}
        >
          <option value="default">Default</option>
          <option value="secret">Secret</option>
        </select>
      </div>
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
