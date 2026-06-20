import { Plus } from "lucide-react";

import type { EnvironmentVariable } from "../../contexts/WorkspaceContext";
import { DynamicGlobalRow } from "./DynamicGlobalRow";
import { EnvironmentHeaderCell } from "./EnvironmentHeaderCell";
import { EnvironmentVariableRow } from "./EnvironmentVariableRow";

interface EnvironmentVariablesTableProps {
  isGlobals: boolean;
  currentVariables: EnvironmentVariable[];
  handleAddVariable: () => void;
  handleUpdateVariable: (
    varId: string,
    updates: Partial<EnvironmentVariable>,
  ) => void;
  handleDeleteVariable: (varId: string) => void;
}

const DYNAMIC_GLOBALS = [
  { key: "$guid", desc: "Generated UUID (dynamic)" },
  { key: "$timestamp", desc: "Unix timestamp (dynamic)" },
  { key: "$isoTimestamp", desc: "ISO timestamp (dynamic)" },
];

export function EnvironmentVariablesTable({
  isGlobals,
  currentVariables,
  handleAddVariable,
  handleUpdateVariable,
  handleDeleteVariable,
}: EnvironmentVariablesTableProps) {
  return (
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
          gridTemplateColumns: "40px 1fr 1fr 100px 40px",
          gap: 0,
          alignItems: "center",
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)",
          borderRadius: "4px 4px 0 0",
          margin: "-1px 0 0 -1px",
        }}
      >
        <EnvironmentHeaderCell />
        <EnvironmentHeaderCell border>Variable</EnvironmentHeaderCell>
        <EnvironmentHeaderCell border>Initial Value</EnvironmentHeaderCell>
        <EnvironmentHeaderCell border>Type</EnvironmentHeaderCell>
        <EnvironmentHeaderCell border />
      </div>
      {isGlobals &&
        DYNAMIC_GLOBALS.map((item) => (
          <DynamicGlobalRow key={item.key} item={item} />
        ))}
      {currentVariables.map((variable) => (
        <EnvironmentVariableRow
          key={variable.id}
          variable={variable}
          onUpdate={handleUpdateVariable}
          onDelete={handleDeleteVariable}
        />
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
        onClick={handleAddVariable}
      >
        <Plus size={14} /> Add Variable
      </button>
    </div>
  );
}
