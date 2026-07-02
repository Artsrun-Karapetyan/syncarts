import { Plus } from "lucide-react";
import { useState } from "react";

import { DynamicGlobalRow } from "@/components/environment/table/DynamicGlobalRow";
import { EnvironmentHeaderCell } from "@/components/environment/table/EnvironmentHeaderCell";
import { EnvironmentVariableRow } from "@/components/environment/table/EnvironmentVariableRow";
import { SelectionArea } from "@/components/ui/SelectionArea/SelectionArea";
import type { EnvironmentVariable } from "@/contexts/WorkspaceContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface EnvironmentVariablesTableProps {
  isGlobals: boolean;
  currentVariables: EnvironmentVariable[];
  handleAddVariable: () => void;
  handleUpdateVariable: (
    varId: string,
    updates: Partial<EnvironmentVariable>,
  ) => void;
  handleDeleteVariable: (varId: string) => void;
  handleReplaceVariables: (next: EnvironmentVariable[]) => void;
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
  handleReplaceVariables,
}: EnvironmentVariablesTableProps) {
  const { secrets } = useWorkspace();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLElement>,
  ) => {
    const text = event.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return;

    event.preventDefault();

    const pastedRows = text.split("\n").filter((r) => r.trim());
    const next = [...currentVariables];

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

    handleReplaceVariables(next);
  };

  const handleCopy = (ids: Set<string>) => {
    const tsv = currentVariables
      .filter((v) => ids.has(`${v.id}-key`) || ids.has(`${v.id}-value`))
      .map((v) => {
        const value = v.type === "secret" ? secrets[v.id] || "" : v.value;
        const parts: string[] = [];
        if (ids.has(`${v.id}-key`)) parts.push(v.key || "");
        if (ids.has(`${v.id}-value`)) parts.push(value);
        return parts.join("\t");
      })
      .join("\n");

    navigator.clipboard.writeText(tsv);
  };

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
      <SelectionArea onSelectionChange={setSelectedIds} onCopy={handleCopy}>
        {currentVariables.map((variable, idx) => (
          <EnvironmentVariableRow
            key={variable.id}
            variable={variable}
            onUpdate={handleUpdateVariable}
            onDelete={handleDeleteVariable}
            onPaste={(e) => handlePaste(idx, e)}
            selectedIds={selectedIds}
          />
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
        onClick={handleAddVariable}
      >
        <Plus size={14} /> Add Variable
      </button>
    </div>
  );
}
