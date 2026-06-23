import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { findSavedRequestByIdInCollections } from "@/contexts/workspace/tabs/helpers/tabHelpers";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface ExtractVariableModalProps {
  jsonPath: string[];
  onClose: () => void;
}

export function ExtractVariableModal({
  jsonPath,
  onClose,
}: ExtractVariableModalProps) {
  const {
    activeTab,
    updateActiveTab,
    environments = [],
    collections = [],
    activeEnvironmentId,
  } = useWorkspace();

  const defaultVarName = String(jsonPath[jsonPath.length - 1] || "variable");
  const [variableName, setVariableName] = useState(defaultVarName);

  // Find the folder name if activeTab has a folderId
  let folderName = "";
  let resolvedFolderId = activeTab?.folderId;
  let resolvedCollectionId = activeTab?.collectionId;

  if (
    activeTab &&
    !resolvedFolderId &&
    (activeTab.savedRequestId || activeTab.id)
  ) {
    const loc = findSavedRequestByIdInCollections(
      collections,
      activeTab.savedRequestId || activeTab.id,
    );
    if (loc) {
      resolvedCollectionId = loc.collectionId;
      resolvedFolderId = loc.folderId || resolvedFolderId;
    }
  }

  if (resolvedFolderId) {
    const findFolder = (items: any[]): any => {
      for (const item of items) {
        if (item.type === "folder") {
          if (item.id === resolvedFolderId) return item;
          const found = findFolder(item.items || []);
          if (found) return found;
        }
      }
      return null;
    };
    const collection = collections.find((c) => c.id === resolvedCollectionId);
    if (collection) {
      const folder = findFolder(collection.items || []);
      if (folder) folderName = folder.name;
    }
  }

  const [scope, setScope] = useState<string>(
    activeEnvironmentId && activeEnvironmentId !== "none"
      ? `env:${activeEnvironmentId}`
      : "global",
  );

  const formatPath = (path: any[]) => {
    return path
      .map((p) => {
        if (typeof p === "number") return `[${p}]`;
        if (p.includes("-") || p.includes(" ")) return `["${p}"]`;
        return `.${p}`;
      })
      .join("");
  };

  const fullPath = `json${formatPath(jsonPath)}`;

  const scopeProperty =
    scope === "global"
      ? "globals"
      : scope === "collection"
        ? "collectionVariables"
        : scope === "folder"
          ? "folderVariables"
          : "environment";

  const generatedScript = `// Auto-extracted variable: ${variableName}
${scope.startsWith("env:") ? `// Note: This script uses pm.environment, so it sets the variable in the ACTIVE environment at run-time.\n` : ""}try {
  const json = pm.response.json();
  pm.${scopeProperty}.set("${variableName}", ${fullPath});
} catch (e) {
  console.error("Failed to extract ${variableName}", e);
}`;

  const handleSave = () => {
    if (!activeTab) return;
    const currentScript = activeTab.testScript || "";
    const prefix = currentScript.trim() ? `${currentScript.trim()}\n\n` : "";
    updateActiveTab({
      testScript: prefix + generatedScript,
    });
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: 480,
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Extract to Variable
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Variable Name
            </label>
            <input
              autoFocus
              className="input-field"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Scope
            </label>
            <select
              className="input-field"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
              }}
            >
              {environments.length > 0 && (
                <optgroup label="Environments">
                  {environments.map((env) => (
                    <option key={env.id} value={`env:${env.id}`}>
                      {env.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {environments.length === 0 && (
                <option value="env:none" disabled>
                  No Environments
                </option>
              )}
              <option value="collection">Collection</option>
              {folderName && (
                <option value="folder">Folder ({folderName})</option>
              )}
              <option value="global">Global</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Generated Script (Appended to Tests)
            </label>
            <pre
              style={{
                background: "var(--bg-tertiary)",
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                border: "1px solid var(--border-color)",
              }}
            >
              {generatedScript}
            </pre>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 8,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!variableName}
              style={{
                padding: "8px 16px",
                background: "var(--accent-primary)",
                border: "none",
                color: "white",
                borderRadius: 6,
                cursor: "pointer",
                opacity: variableName ? 1 : 0.5,
              }}
            >
              Save Extractor
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
