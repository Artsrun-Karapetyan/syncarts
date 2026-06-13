import type { CSSProperties } from "react";
import { useRef } from "react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { UrlVariablePopover } from "./UrlVariablePopover";
import { useVariableAutocomplete } from "./useVariableAutocomplete";
import { useVariableHover } from "./useVariableHover";
import { VariableAutocompletePopover } from "./VariableAutocompletePopover";
import { renderVariableHighlight } from "./variableHighlight";

interface VariableTextareaProps {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  value: string;
  onChange: (value: string) => void;
}

export function VariableTextarea(props: VariableTextareaProps) {
  const {
    className = "input",
    disabled,
    placeholder,
    style,
    value,
    onChange,
  } = props;
  const { activeEnvironment, activeTab, collections, globalVariables } =
    useWorkspace();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const autocomplete = useVariableAutocomplete({ value, onChange });
  const hover = useVariableHover(overlayRef);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flex: style?.flex || 1,
        minHeight: 0,
        width: style?.width,
      }}
    >
      <div
        ref={overlayRef}
        className={className}
        style={{
          ...style,
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          color: value ? "var(--text-primary)" : "var(--text-tertiary)",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          zIndex: 1,
        }}
        aria-hidden="true"
      >
        {value
          ? renderVariableHighlight({
              text: value,
              activeTab,
              collections,
              activeEnvironment,
              globalVariables,
            })
          : placeholder}
      </div>
      <textarea
        className={`${className} variable-input-proxy`}
        style={{
          ...style,
          position: "relative",
          color: "transparent",
          caretColor: "var(--text-primary)",
          background: "transparent",
          zIndex: 2,
        }}
        placeholder=""
        value={value}
        disabled={disabled}
        onBlur={autocomplete.handleBlur}
        onChange={autocomplete.handleChange}
        onClick={autocomplete.handleClick}
        onFocus={autocomplete.handleFocus}
        onMouseMove={hover.handleMouseMove}
        onMouseLeave={hover.handleMouseLeave}
        onKeyDown={(event) => {
          autocomplete.handleKeyDown(event);
        }}
        onKeyUp={autocomplete.handleKeyUp}
        onScroll={(event) => {
          if (!overlayRef.current) return;
          overlayRef.current.scrollTop = event.currentTarget.scrollTop;
          overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
        spellCheck={false}
      />
      {autocomplete.autocompleteState && (
        <VariableAutocompletePopover
          activeIndex={autocomplete.activeIndex}
          suggestions={autocomplete.suggestions}
          x={autocomplete.autocompleteState.x}
          y={autocomplete.autocompleteState.y}
          onSelect={(suggestion) =>
            autocomplete.insertSuggestion(
              suggestion,
              document.activeElement as HTMLTextAreaElement,
            )
          }
        />
      )}
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
    </div>
  );
}
