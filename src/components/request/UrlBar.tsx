import "./UrlBar.css";

import { useEffect, useRef } from "react";

import { getRequestAncestors } from "../../contexts/workspace/requestHelpers";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { parseCurlCommand } from "../../utils/curlParser";
import { syncPathVariablesWithUrl } from "../../utils/pathVariables";
import { parseQueryParamsFromUrl } from "./urlQueryParams";
import { UrlVariablePopover } from "./UrlVariablePopover";
import { useVariableAutocomplete } from "./useVariableAutocomplete";
import { useVariableHover } from "./useVariableHover";
import { VariableAutocompletePopover } from "./VariableAutocompletePopover";
import { getVariableColors } from "./variableHighlight";
import { resolveScopedVariable } from "./variableResolution";

const AUTO_REQUEST_NAMES = new Set(["Untitled Request", "New Request"]);
const PATH_VARIABLE_REGEX = /(^|\/):([A-Za-z_][A-Za-z0-9_]*)/g;

export function UrlBar() {
  const {
    activeTab,
    updateActiveTab,
    sendRequest,
    activeEnvironment,
    collections,
    globalVariables,
  } = useWorkspace();

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.trim().toLowerCase().startsWith("curl ")) {
      const parsed = parseCurlCommand(text);
      if (parsed) {
        e.preventDefault(); // Prevent pasting just the curl string into the URL
        updateActiveTab({
          ...parsed,
          queryParams: parseQueryParamsFromUrl(
            parsed.url || "",
            parsed.queryParamDescriptions || {},
          ),
        });
      }
    }
  };

  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = activeTab?.url || "";

  const hover = useVariableHover(overlayRef);
  const resolveVariable = (varName: string) => {
    const ancestors = getRequestAncestors(activeTab, collections);
    return resolveScopedVariable({
      ancestors,
      activeEnvironment,
      globalVariables,
      varName,
    });
  };
  const updateUrlValue = (newUrl: string) => {
    const updates: any = {
      url: newUrl,
      pathVariables: syncPathVariablesWithUrl(
        newUrl,
        activeTab?.pathVariables || [],
      ),
      queryParams: parseQueryParamsFromUrl(
        newUrl,
        activeTab?.queryParamDescriptions || {},
      ),
    };
    if (
      !activeTab?.name ||
      AUTO_REQUEST_NAMES.has(activeTab.name) ||
      activeTab.name === activeTab.url
    ) {
      updates.name = newUrl;
    }
    updateActiveTab(updates);
  };
  const autocomplete = useVariableAutocomplete({
    value: url,
    onChange: updateUrlValue,
  });

  useEffect(() => {
    // Auto-focus URL bar when a new/empty request is opened
    if (activeTab && activeTab.url === "") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [activeTab?.id]);

  const renderPathVariables = (part: string, baseKey: string) => {
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    PATH_VARIABLE_REGEX.lastIndex = 0;
    while ((match = PATH_VARIABLE_REGEX.exec(part)) !== null) {
      const prefix = match[1];
      const key = match[2];
      const tokenStart = match.index + prefix.length;
      const tokenEnd = tokenStart + key.length + 1;
      const variable = activeTab?.pathVariables?.find(
        (item) => item.key === key,
      );
      const value = variable?.value || "";

      if (tokenStart > lastIndex)
        nodes.push(
          <span key={`${baseKey}-t-${lastIndex}`}>
            {part.slice(lastIndex, tokenStart)}
          </span>,
        );
      nodes.push(
        <span
          key={`${baseKey}-p-${tokenStart}`}
          className="path-var-span"
          data-kind="path"
          data-varname={key}
          data-exists={!!variable}
          data-has-value={!!value}
          data-value={value}
          data-source="Path variable"
          style={{
            color: value ? "var(--text-secondary)" : "var(--status-delete)",
          }}
        >
          <span>:</span>
          <span>{key}</span>
        </span>,
      );
      lastIndex = tokenEnd;
    }

    if (lastIndex < part.length)
      nodes.push(<span key={`${baseKey}-t-end`}>{part.slice(lastIndex)}</span>);
    return nodes;
  };

  const renderHighlighted = () => {
    const parts = url.split(/(\{\{[^}]*\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        const varName = part.substring(2, part.length - 2);
        const resolved = resolveVariable(varName);
        const isDynamic = ["$guid", "$timestamp", "$isoTimestamp"].includes(
          varName,
        );

        if (resolved.hasValue || isDynamic) {
          const colors = getVariableColors(resolved.sourceType, isDynamic);
          return (
            <span
              key={i}
              className="env-var-span"
              data-kind="environment"
              data-varname={varName}
              data-exists={resolved.exists}
              data-has-value={resolved.hasValue}
              data-value={resolved.value || ""}
              data-source={resolved.source}
              data-source-type={resolved.sourceType}
              style={{ color: colors.color }}
            >
              <span>{"{{"}</span>
              <span>{varName}</span>
              <span>{"}}"}</span>
            </span>
          );
        }

        return (
          <span
            key={i}
            className="env-var-span"
            data-kind="environment"
            data-varname={varName}
            data-exists={false}
            data-has-value={false}
            data-value=""
            data-source=""
            data-source-type=""
            style={{ color: "var(--status-delete)" }}
          >
            {part}
          </span>
        );
      }
      return renderPathVariables(part, String(i));
    });
  };

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        alignItems: "center",
        height: 34,
        overflow: "hidden",
        borderRadius: 9999,
      }}
    >
      {/* Overlay for highlighting */}
      <div
        ref={overlayRef}
        className="url-input font-mono"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          color: url ? "var(--text-primary)" : "var(--text-tertiary)",
          opacity: url ? 1 : 0.6,
          overflow: "hidden",
          whiteSpace: "pre",
          zIndex: 1,
          lineHeight: "34px",
        }}
        aria-hidden="true"
      >
        {url
          ? renderHighlighted()
          : "https://api.example.com/v1/users (or paste cURL)"}
      </div>

      {/* Actual Input */}
      <input
        ref={inputRef}
        className="url-input font-mono variable-input-proxy"
        style={{
          position: "absolute",
          inset: 0,
          color: "transparent",
          caretColor: "var(--text-primary)",
          background: "transparent",
          zIndex: 2,
          lineHeight: "34px",
        }}
        value={url}
        onBlur={autocomplete.handleBlur}
        onChange={autocomplete.handleChange}
        onClick={autocomplete.handleClick}
        onFocus={autocomplete.handleFocus}
        onScroll={(e) => {
          if (overlayRef.current) {
            overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
          }
        }}
        onMouseMove={hover.handleMouseMove}
        onMouseLeave={hover.handleMouseLeave}
        onKeyDown={(e) => {
          if (autocomplete.handleKeyDown(e)) return;
          if (e.key === "Enter" && url) {
            sendRequest();
          }
          if (e.key === "Escape") {
            hover.clearHideTimeout();
          }
        }}
        onKeyUp={autocomplete.handleKeyUp}
        onPaste={handlePaste}
        disabled={!activeTab}
        spellCheck={false}
      />

      {hover.hoveredVar && (
        <UrlVariablePopover
          hoveredVar={hover.hoveredVar}
          popoverRef={hover.popoverRef}
          onSave={hover.handleAddVar}
          onSaveCollection={hover.handleAddCollectionVar}
          onMouseEnter={hover.clearHideTimeout}
          onMouseLeave={hover.handleMouseLeave}
          onOpenCollectionVariables={hover.openCollectionVariables}
          onOpenPathVariables={hover.openPathVariables}
          canOpenCollectionVariables={!!hover.closestAncestor}
          variableTargetLabel={
            hover.closestAncestor &&
            "type" in hover.closestAncestor &&
            hover.closestAncestor.type === "folder"
              ? "Folder"
              : hover.closestAncestor
                ? "Collection"
                : "Environment"
          }
        />
      )}
      {autocomplete.autocompleteState && (
        <VariableAutocompletePopover
          activeIndex={autocomplete.activeIndex}
          suggestions={autocomplete.suggestions}
          x={autocomplete.autocompleteState.x}
          y={autocomplete.autocompleteState.y}
          onSelect={(suggestion) =>
            autocomplete.insertSuggestion(suggestion, inputRef.current)
          }
        />
      )}
    </div>
  );
}
