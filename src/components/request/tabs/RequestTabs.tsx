import "./RequestTabs.css";

import { useEffect, useState } from "react";

import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { extractPathVariableKeys } from "../../../utils/pathVariables";
import { AuthEditor } from "../auth/AuthEditor";
import { BodyEditor } from "../body/BodyEditor";
import { findExampleInItems } from "../docs/findExampleInItems";
import { DocsEditor } from "../DocsEditor";
import { ExampleDocsEditor } from "../ExampleDocsEditor";
import { HeadersEditor } from "../HeadersEditor";
import { ParamsEditor } from "../params/ParamsEditor";
import { ScriptsEditor } from "../scripts/ScriptsEditor";

type Tab = "headers" | "body" | "auth" | "params" | "scripts" | "docs";

const TABS: { id: Tab; label: string; disabled?: boolean }[] = [
  { id: "params", label: "Params" },
  { id: "auth", label: "Auth" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "scripts", label: "Scripts" },
  { id: "docs", label: "Docs" },
];

export function RequestTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("headers");
  const { activeTab: activeRequest, collections } = useWorkspace();

  const isExample = activeRequest?.type === "example";

  const example =
    isExample && activeRequest?.exampleId && activeRequest?.collectionId
      ? (() => {
          const col = collections.find(
            (c) => c.id === activeRequest.collectionId,
          );
          if (!col) return null;
          return findExampleInItems(col.items, activeRequest.exampleId);
        })()
      : null;

  useEffect(() => {
    const handleOpenTab = (event: Event) => {
      const tab = (event as CustomEvent<{ tab?: Tab }>).detail?.tab;
      if (tab && TABS.some((item) => item.id === tab)) setActiveTab(tab);
    };

    window.addEventListener("syncarts:open-request-tab", handleOpenTab);
    return () =>
      window.removeEventListener("syncarts:open-request-tab", handleOpenTab);
  }, []);

  const filledHeadersCount =
    activeRequest?.headers.filter((h) => h.enabled !== false && h.key.trim())
      .length ?? 0;

  // Calculate params count
  const getParamsCount = () => {
    if (activeRequest?.queryParams) {
      return (
        activeRequest.queryParams.filter(
          (p) => p.enabled !== false && p.key.trim(),
        ).length + extractPathVariableKeys(activeRequest.url || "").length
      );
    }
    if (!activeRequest?.url) return 0;
    try {
      const [, query] = activeRequest.url.split("?");
      const pathCount = extractPathVariableKeys(activeRequest.url).length;
      if (!query) return pathCount;
      const queryCount = query
        .split("&")
        .filter((p) => p.trim() && p !== "=").length;
      return queryCount + pathCount;
    } catch {
      return extractPathVariableKeys(activeRequest.url).length;
    }
  };
  const paramsCount = getParamsCount();

  // Calculate auth state

  // Calculate body state
  let bodyBadge: React.ReactNode = null;
  if (
    activeRequest?.bodyType === "form-data" ||
    activeRequest?.bodyType === "x-www-form-urlencoded"
  ) {
    const count =
      activeRequest.formData?.filter((f) => f.key.trim() || f.value.trim())
        .length || 0;
    if (count > 0) bodyBadge = <span className="tab-badge">{count}</span>;
  } else if (activeRequest?.bodyType === "raw" && activeRequest.body?.trim()) {
    bodyBadge = (
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--status-success)",
          marginLeft: 6,
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid var(--border-color)",
          paddingLeft: 4,
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.disabled}
            style={{ opacity: tab.disabled ? 0.35 : 1 }}
          >
            {tab.label}
            {tab.id === "headers" && filledHeadersCount > 0 && (
              <span className="tab-badge">{filledHeadersCount}</span>
            )}
            {tab.id === "params" && paramsCount > 0 && (
              <span className="tab-badge">{paramsCount}</span>
            )}
            {tab.id === "body" && bodyBadge}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: activeTab === "scripts" || activeTab === "docs" ? 0 : 16,
        }}
      >
        {activeTab === "headers" && <HeadersEditor />}
        {activeTab === "body" && <BodyEditor />}
        {activeTab === "params" && <ParamsEditor />}
        {activeTab === "auth" && <AuthEditor />}
        {activeTab === "scripts" && <ScriptsEditor />}
        {activeTab === "docs" &&
          (isExample && example && activeRequest?.collectionId ? (
            <ExampleDocsEditor
              example={example.example}
              requestId={example.requestId}
              collectionId={activeRequest.collectionId}
            />
          ) : (
            <DocsEditor />
          ))}
      </div>
    </div>
  );
}
