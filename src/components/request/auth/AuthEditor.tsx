import { useRef, useState } from "react";

import {
  AuthTokenInput,
  type HoveredVariable,
} from "@/components/request/auth/AuthTokenInput";
import { AuthVariablePopover } from "@/components/request/auth/AuthVariablePopover";
import {
  resolveScopedVariable,
  upsertActiveVariableValue,
} from "@/components/request/variables/variableResolution";
import { Select } from "@/components/ui/Select/Select";
import { getRequestAncestors } from "@/contexts/workspace/requests/requestHelpers";
import { resolveRequestAuth } from "@/contexts/workspace/requests/requestHelpers";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type AuthType = "inherit" | "none" | "bearer";

export function AuthEditor() {
  const {
    activeTab,
    updateActiveTab,
    activeEnvironment,
    updateEnvironment,
    collections,
    globalVariables,
    updateCollection,
    openCollectionTab,
  } = useWorkspace();

  const overlayRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<any>(null);
  const [hoveredVar, setHoveredVar] = useState<HoveredVariable | null>(null);

  // Determine current auth state based on activeTab
  const currentType: AuthType = activeTab?.authType || "inherit";
  const currentToken = activeTab?.bearerToken || "";
  const resolvedAuth = resolveRequestAuth(activeTab, collections);
  const displayedToken =
    currentType === "inherit" ? resolvedAuth.bearerToken : currentToken;
  const activeCollection = activeTab?.collectionId
    ? collections.find((c) => c.id === activeTab.collectionId)
    : undefined;

  const handleTypeChange = (type: AuthType) => {
    if (!activeTab) return;
    updateActiveTab({ authType: type });
  };

  const handleTokenChange = (token: string) => {
    if (!activeTab) return;
    updateActiveTab({ bearerToken: token });
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setHoveredVar(null), 150);
  };

  const handleAddVar = (varName: string, value: string) => {
    if (activeCollection) {
      updateCollection(activeCollection.id, {
        variables: upsertActiveVariableValue(
          activeCollection.variables || [],
          varName,
          value,
        ),
      });
      setHoveredVar(null);
      return;
    }

    if (!activeEnvironment) {
      alert("Please create or select an Environment first.");
      return;
    }
    updateEnvironment(activeEnvironment.id, {
      variables: upsertActiveVariableValue(
        activeEnvironment.variables,
        varName,
        value,
      ),
    });
    setHoveredVar(null);
  };

  const resolveVariable = (varName: string) => {
    const ancestors = getRequestAncestors(activeTab, collections);
    return resolveScopedVariable({
      ancestors,
      activeEnvironment,
      globalVariables,
      varName,
    });
  };

  const openCollectionVariables = () => {
    if (!activeCollection) return;
    setHoveredVar(null);
    openCollectionTab(activeCollection.id, "variables");
  };

  const renderHighlighted = (token: string) => {
    const parts = token.split(/(\{\{[^}]*\}\})/g);
    return parts.map((part) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        const varName = part.substring(2, part.length - 2);
        const resolved = resolveVariable(varName);
        return (
          <span
            key={`${part}-${varName}`}
            className="env-var-span"
            data-varname={varName}
            data-exists={resolved.exists}
            data-has-value={resolved.hasValue}
            data-value={resolved.value || ""}
            data-source={resolved.source || ""}
            style={{
              color: resolved.hasValue
                ? "var(--accent-primary)"
                : "var(--status-delete)",
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={part}>{part}</span>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Auth Type
        </label>
        <Select
          style={{ width: 200, fontSize: 13 }}
          value={currentType}
          onChange={(val) => handleTypeChange(val as AuthType)}
          disabled={!activeTab}
          options={[
            { label: "Inherit auth from parent", value: "inherit" },
            { label: "No Auth", value: "none" },
            { label: "Bearer Token", value: "bearer" },
          ]}
        />
      </div>

      <div
        style={{
          height: "1px",
          background: "var(--border-color)",
          opacity: 0.5,
        }}
      />

      {currentType === "inherit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
            This request will inherit authentication from its parent folder or
            collection.
          </div>
          {resolvedAuth.authType === "bearer" && (
            <AuthTokenInput
              disabled
              hideTimeout={hideTimeout}
              hoveredVar={hoveredVar}
              label={`Bearer Token${resolvedAuth.inheritedFrom ? ` from ${resolvedAuth.inheritedFrom.name}` : ""}`}
              overlayRef={overlayRef}
              renderHighlighted={() => renderHighlighted(displayedToken)}
              setHoveredVar={setHoveredVar}
              token={displayedToken}
              onChange={() => undefined}
            />
          )}
        </div>
      )}

      {currentType === "none" && (
        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: 13,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          This request does not use any authorization.
        </div>
      )}

      {currentType === "bearer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AuthTokenInput
            disabled={!activeTab}
            hideTimeout={hideTimeout}
            hoveredVar={hoveredVar}
            label="Token"
            overlayRef={overlayRef}
            renderHighlighted={() => renderHighlighted(currentToken)}
            setHoveredVar={setHoveredVar}
            token={currentToken}
            onChange={handleTokenChange}
          />
          <div
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginTop: 4,
            }}
          >
            The authorization header will be automatically generated when you
            send the request.
          </div>
          {activeTab?.type !== "collection" && activeTab?.type !== "folder" && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "var(--bg-tertiary)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--text-tertiary)",
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  padding: 4,
                  background: "var(--bg-secondary)",
                  borderRadius: 6,
                  color: "var(--text-secondary)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <strong>Tip:</strong> If you manually added an Authorization
                header in the Headers tab, you should remove it so it doesn't
                conflict with this setting.
              </div>
            </div>
          )}
        </div>
      )}
      {hoveredVar && (
        <AuthVariablePopover
          activeCollectionId={activeCollection?.id}
          hideTimeout={hideTimeout}
          hoveredVar={hoveredVar}
          onAddVar={handleAddVar}
          onMouseLeave={handleMouseLeave}
          onOpenCollectionVariables={openCollectionVariables}
        />
      )}
    </div>
  );
}
