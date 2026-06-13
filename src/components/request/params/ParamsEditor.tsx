import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  PathVariable,
  QueryParamItem,
  useWorkspace,
} from "../../../contexts/WorkspaceContext";
import { syncPathVariablesWithUrl } from "../../../utils/pathVariables";
import { VariableTextInput } from "../variables/VariableTextInput";
import { ParamSectionTitle } from "./ParamSectionTitle";
import {
  createEmptyParam,
  ensureTrailingBlank,
  parseParamsFromUrl,
} from "./paramsEditorHelpers";

export function ParamsEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [params, setParams] = useState<QueryParamItem[]>([createEmptyParam()]);
  const pathVariables = activeTab?.pathVariables || [];
  const queryParamDescriptions = activeTab?.queryParamDescriptions || {};

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
    setParams(ensureTrailingBlank(nextParams));
  }, [
    activeTab?.url,
    activeTab?.queryParams,
    activeTab?.queryParamDescriptions,
  ]);

  const syncUrl = (newParams: QueryParamItem[]) => {
    setParams(ensureTrailingBlank(newParams));
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

    const queryParts = enabledParams.map(
      (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`,
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
    setParams((prev) => [...prev, createEmptyParam()]);
  };

  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    syncUrl(newParams.length > 0 ? newParams : [createEmptyParam()]);
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
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 1fr 1fr 40px",
              gap: 0,
              alignItems: "center",
              opacity: param.enabled === false ? 0.45 : 1,
            }}
          >
            <div
              style={{ width: 40, display: "flex", justifyContent: "center" }}
            >
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color:
                    param.enabled !== false
                      ? "var(--accent-primary)"
                      : "var(--text-tertiary)",
                }}
                onClick={() =>
                  updateParam(idx, { enabled: param.enabled === false })
                }
                title={
                  param.enabled === false ? "Enable param" : "Disable param"
                }
              >
                {param.enabled !== false ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
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
              placeholder="Key"
              value={param.key}
              onChange={(value) => updateParam(idx, { key: value })}
              disabled={!activeTab}
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
              value={param.value}
              onChange={(value) => updateParam(idx, { value })}
              disabled={!activeTab}
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
              placeholder="Description"
              value={param.description || ""}
              onChange={(value) => updateParam(idx, { description: value })}
              disabled={!activeTab}
            />
            <div
              style={{ width: 40, display: "flex", justifyContent: "center" }}
            >
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: activeTab ? "pointer" : "not-allowed",
                  color: "var(--text-tertiary)",
                  opacity: activeTab ? 1 : 0.3,
                }}
                onClick={() => {
                  if (activeTab) removeParam(idx);
                }}
                onMouseEnter={(e) => {
                  if (activeTab)
                    e.currentTarget.style.color = "var(--status-delete)";
                }}
                onMouseLeave={(e) => {
                  if (activeTab)
                    e.currentTarget.style.color = "var(--text-tertiary)";
                }}
                title="Remove Param"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
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
            <div
              key={variable.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 1fr 40px",
                gap: 0,
                alignItems: "center",
              }}
            >
              <div style={{ width: 40 }} />
              <input
                className="input"
                style={{
                  width: "100%",
                  fontSize: 13,
                  background: "transparent",
                  color: "var(--text-secondary)",
                  borderRadius: 0,
                  margin: "-1px 0 0 -1px",
                }}
                value={variable.key}
                disabled
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
                onChange={(value) => updatePathVariable(variable.id, { value })}
                disabled={!activeTab}
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
                placeholder="Description"
                value={variable.description || ""}
                onChange={(value) =>
                  updatePathVariable(variable.id, { description: value })
                }
                disabled={!activeTab}
              />
              <div
                style={{ width: 40, display: "flex", justifyContent: "center" }}
              >
                <span
                  style={{ color: "var(--text-tertiary)", textAlign: "center" }}
                >
                  ...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
