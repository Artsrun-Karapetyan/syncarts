import { Plus } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
  PathVariable,
  QueryParamItem,
  useWorkspace,
} from "../../../contexts/WorkspaceContext";
import { syncPathVariablesWithUrl } from "../../../utils/pathVariables";
import {
  getRowDropPosition,
  readRowDragData,
  type RowDropTarget,
} from "../rowDrag";
import { syncRowKeys } from "../rowKeys";
import { reorderRows } from "../rowReorder";
import { ParamSectionTitle } from "./ParamSectionTitle";
import { createEmptyParam, parseParamsFromUrl } from "./paramsEditorHelpers";
import { PathVariableRow } from "./PathVariableRow";
import { QueryParamRow } from "./QueryParamRow";

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

  const updatePathVariable = (id: string, data: Partial<PathVariable>) => {
    updateActiveTab({
      pathVariables: pathVariables.map((variable) =>
        variable.id === id ? { ...variable, ...data } : variable,
      ),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
            setDraggingId={setDraggingParamKey}
            onDragEnd={clearParamDrag}
            onDragOver={handleParamDragOver}
            onDrop={handleParamDrop}
            onRemove={removeParam}
            onUpdate={updateParam}
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
