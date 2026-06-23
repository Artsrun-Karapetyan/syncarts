import { Plus } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { ParamSectionTitle } from "@/components/request/params/ParamSectionTitle";
import {
  createEmptyParam,
  parseParamsFromUrl,
} from "@/components/request/params/paramsEditorHelpers";
import { PathVariableRow } from "@/components/request/params/PathVariableRow";
import { QueryParamRow } from "@/components/request/params/QueryParamRow";
import {
  getRowDropPosition,
  readRowDragData,
  type RowDropTarget,
} from "@/components/request/rowDrag";
import { syncRowKeys } from "@/components/request/rowKeys";
import { reorderRows } from "@/components/request/rowReorder";
import { SelectionArea } from "@/components/ui/SelectionArea/SelectionArea";
import {
  PathVariable,
  QueryParamItem,
  useWorkspace,
} from "@/contexts/WorkspaceContext";
import { syncPathVariablesWithUrl } from "@/utils/pathVariables";

export function ParamsEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [params, setParams] = useState<QueryParamItem[]>([createEmptyParam()]);
  const pathVariables = activeTab?.pathVariables || [];
  const queryParamDescriptions = activeTab?.queryParamDescriptions || {};
  const rowKeysRef = useRef<string[]>([]);
  const rowKeys = syncRowKeys(rowKeysRef.current, params.length);
  const [draggingParamKey, setDraggingParamKey] = useState<string | null>(null);
  const [paramDropTarget, setParamDropTarget] = useState<RowDropTarget | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeTab) return;
    const synced = syncPathVariablesWithUrl(
      activeTab.url || "",
      activeTab.pathVariables || [],
    );
    if (
      JSON.stringify(synced) !== JSON.stringify(activeTab.pathVariables || [])
    ) {
      updateActiveTab({ pathVariables: synced });
    }
  }, [activeTab?.url, activeTab?.pathVariables]);

  useEffect(() => {
    if (!activeTab) return;
    const nextParams = activeTab.queryParams?.length
      ? activeTab.queryParams
      : parseParamsFromUrl(activeTab.url || "", queryParamDescriptions);
    setParams(nextParams);
  }, [
    activeTab?.url,
    activeTab?.queryParams,
    activeTab?.queryParamDescriptions,
  ]);

  const syncUrl = (newParams: QueryParamItem[]) => {
    setParams(newParams);
    if (!activeTab) return;

    const baseUrl = activeTab.url.split("?")[0] || "";
    const enabledParams = newParams.filter(
      (p) => p.enabled !== false && p.key.trim(),
    );
    const descriptions = Object.fromEntries(
      newParams
        .filter((p) => p.key && p.description)
        .map((p) => [p.key, p.description || ""]),
    );

    if (enabledParams.length === 0) {
      updateActiveTab({
        url: baseUrl,
        queryParamDescriptions: descriptions,
        queryParams: newParams,
      });
      return;
    }

    const encodeWithVars = (val: string) => {
      const parts = val.split(/(\{\{[^}]+\}\})/g);
      return parts
        .map((part) => {
          if (part.startsWith("{{") && part.endsWith("}}")) {
            return part;
          }
          return encodeURIComponent(part);
        })
        .join("");
    };

    const queryParts = enabledParams.map(
      (p) => `${encodeWithVars(p.key)}=${encodeWithVars(p.value)}`,
    );
    const nextUrl = `${baseUrl}?${queryParts.join("&")}`;
    updateActiveTab({
      url: nextUrl,
      queryParamDescriptions: descriptions,
      queryParams: newParams,
    });
  };

  const updateParam = (index: number, updates: Partial<QueryParamItem>) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], ...updates };
    syncUrl(newParams);
  };

  const addParam = () => {
    rowKeysRef.current.push(crypto.randomUUID());
    setParams((prev) => [...prev, createEmptyParam()]);
  };

  const removeParam = (index: number) => {
    rowKeysRef.current.splice(index, 1);
    const newParams = params.filter((_, i) => i !== index);
    syncUrl(newParams.length > 0 ? newParams : [createEmptyParam()]);
  };

  const clearParamDrag = () => {
    setDraggingParamKey(null);
    setParamDropTarget(null);
  };

  const handleParamDragOver = (
    targetKey: string,
    event: DragEvent<HTMLElement>,
  ) => {
    if (!activeTab || !draggingParamKey || draggingParamKey === targetKey)
      return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setParamDropTarget({
      id: targetKey,
      position: getRowDropPosition(event),
    });
  };

  const handleParamDrop = (
    targetKey: string,
    event: DragEvent<HTMLElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceKey = draggingParamKey || readRowDragData(event);
    if (!activeTab || !sourceKey || sourceKey === targetKey) return;

    const sourceIndex = rowKeys.indexOf(sourceKey);
    const targetIndex = rowKeys.indexOf(targetKey);
    const position = getRowDropPosition(event);
    const nextParams = reorderRows(params, sourceIndex, targetIndex, position);
    rowKeysRef.current = reorderRows(
      rowKeys,
      sourceIndex,
      targetIndex,
      position,
    );
    syncUrl(nextParams);
    clearParamDrag();
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const text = event.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return;

    event.preventDefault();

    const pastedRows = text.split("\n").filter((r) => r.trim());
    const newParams = [...params];

    pastedRows.forEach((row, i) => {
      let cols = row.split("\t");
      // If copied from our app, the first column is the checkbox (empty text)
      if (cols.length > 3 && cols[0].trim() === "") {
        cols = cols.slice(1);
      }

      const param = {
        key: cols[0] || "",
        value: cols[1] || "",
        description: cols[2] || "",
        enabled: true,
      };

      if (i === 0) {
        newParams[index] = { ...newParams[index], ...param };
      } else {
        newParams.splice(index + i, 0, param);
        rowKeysRef.current.splice(index + i, 0, crypto.randomUUID());
      }
    });

    syncUrl(newParams);
  };

  const updatePathVariable = (id: string, data: Partial<PathVariable>) => {
    updateActiveTab({
      pathVariables: pathVariables.map((variable) =>
        variable.id === id ? { ...variable, ...data } : variable,
      ),
    });
  };

  const handleCopy = (ids: Set<string>) => {
    const selectedParams = params.filter(
      (_, i) =>
        ids.has(`${rowKeys[i]}-key`) ||
        ids.has(`${rowKeys[i]}-value`) ||
        ids.has(`${rowKeys[i]}-description`),
    );
    if (selectedParams.length === 0) return;

    const tsv = selectedParams
      .map((p) => {
        const id = rowKeys[params.indexOf(p)];
        const parts = [];
        if (ids.has(`${id}-key`)) parts.push(p.key || "");
        if (ids.has(`${id}-value`)) parts.push(p.value || "");
        if (ids.has(`${id}-description`)) parts.push(p.description || "");
        return parts.join("\t");
      })
      .join("\n");

    navigator.clipboard.writeText(tsv);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SelectionArea onSelectionChange={setSelectedIds} onCopy={handleCopy}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            paddingTop: 1,
            paddingLeft: 1,
          }}
        >
          <ParamSectionTitle title="Query Params" />
          {params.map((param, idx) => (
            <QueryParamRow
              key={rowKeys[idx]}
              active={!!activeTab}
              dragId={rowKeys[idx]}
              draggingId={draggingParamKey}
              dropTarget={paramDropTarget}
              index={idx}
              param={param}
              selectedIds={selectedIds}
              setDraggingId={setDraggingParamKey}
              onDragEnd={clearParamDrag}
              onDragOver={handleParamDragOver}
              onDrop={handleParamDrop}
              onRemove={removeParam}
              onUpdate={updateParam}
              onPaste={handlePaste}
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
              cursor: activeTab ? "pointer" : "not-allowed",
              opacity: activeTab ? 1 : 0.5,
              fontSize: 13,
              fontWeight: 500,
              transition: "all var(--transition-fast)",
            }}
            onClick={() => {
              if (activeTab) addParam();
            }}
            onMouseEnter={(e) => {
              if (!activeTab) return;
              e.currentTarget.style.borderColor = "var(--border-highlight)";
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              if (!activeTab) return;
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Plus size={14} /> Add Param
          </button>
        </div>
      </SelectionArea>

      {pathVariables.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            paddingTop: 1,
            paddingLeft: 1,
          }}
        >
          <ParamSectionTitle title="Path Variables" />
          {pathVariables.map((variable) => (
            <PathVariableRow
              key={variable.id}
              active={!!activeTab}
              variable={variable}
              onUpdate={updatePathVariable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
