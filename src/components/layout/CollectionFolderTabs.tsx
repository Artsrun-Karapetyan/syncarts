import { useWorkspace } from "../../contexts/WorkspaceContext";
import { AuthEditor } from "../request/auth/AuthEditor";
import { CollectionVariablesEditor } from "../request/CollectionVariablesEditor";
import { DocsEditor } from "../request/DocsEditor";
import { CollectionRunner } from "../request/runs/CollectionRunner";
import { ScriptsEditor } from "../request/scripts/ScriptsEditor";

type Tab = "overview" | "authorization" | "scripts" | "variables" | "runs";

export function CollectionFolderTabs() {
  const { activeTab, collections, updateActiveTab } = useWorkspace();

  if (
    !activeTab ||
    (activeTab.type !== "collection" && activeTab.type !== "folder")
  ) {
    return null;
  }

  const isCollection = activeTab.type === "collection";
  const activeCollection = activeTab.collectionId
    ? collections.find((item) => item.id === activeTab.collectionId)
    : undefined;
  const activeView: Tab = activeTab.collectionView || "overview";
  const handleViewChange = (view: Tab) => {
    updateActiveTab({ collectionView: view });
  };

  const TABS: { id: Tab; label: string; hide?: boolean }[] = [
    { id: "overview", label: "Overview" },
    { id: "authorization", label: "Authorization" },
    { id: "scripts", label: "Scripts" },
    { id: "variables", label: "Variables" },
    { id: "runs", label: "Runs" },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "24px 32px 16px", flexShrink: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          {isCollection ? "Collection" : "Folder"}
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: 0,
            color: "var(--text-primary)",
          }}
        >
          {activeTab.name}
        </h1>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid var(--border-color)",
          paddingLeft: 24,
          flexShrink: 0,
        }}
      >
        {TABS.filter((t) => !t.hide).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeView === tab.id ? "active" : ""}`}
            onClick={() => handleViewChange(tab.id)}
            style={{ padding: "12px 16px", fontSize: 13 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding:
            activeView === "authorization" || activeView === "runs" ? 32 : 0,
        }}
      >
        {activeView === "overview" && (
          <div style={{ height: "100%" }}>
            <DocsEditor />
          </div>
        )}
        {activeView === "authorization" && (
          <div style={{ height: "100%" }}>
            <AuthEditor />
          </div>
        )}
        {activeView === "scripts" && (
          <div style={{ height: "100%" }}>
            <ScriptsEditor />
          </div>
        )}
        {activeView === "variables" && (
          <div style={{ height: "100%" }}>
            <CollectionVariablesEditor />
          </div>
        )}
        {activeView === "runs" && activeCollection && (
          <CollectionRunner
            collection={activeCollection}
            folderId={
              activeTab.type === "folder" ? activeTab.folderId : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
