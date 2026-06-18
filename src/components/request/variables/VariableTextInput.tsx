import { Link } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";

import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { ChainingPickerModal } from "../chaining/ChainingPickerModal";
import { UrlVariablePopover } from "../url/UrlVariablePopover";
import { useVariableAutocomplete } from "./useVariableAutocomplete";
import { useVariableHover } from "./useVariableHover";
import { VariableAutocompletePopover } from "./VariableAutocompletePopover";
import { renderVariableHighlight } from "./variableHighlight";

interface VariableTextInputProps {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  value: string;
  onChange: (value: string) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  selectionId?: string;
  isSelected?: boolean;
}

export function VariableTextInput(props: VariableTextInputProps) {
  const {
    className = "input",
    disabled,
    placeholder,
    style,
    value,
    onChange,
    onPaste,
    selectionId,
    isSelected,
  } = props;
  const {
    activeTab,
    collections,
    activeEnvironment,
    globalVariables,
    responseCache,
  } = useWorkspace();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const autocomplete = useVariableAutocomplete({ value, onChange });
  const hover = useVariableHover(overlayRef);
  const [isChainingOpen, setIsChainingOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      data-selection-id={selectionId}
      style={{
        position: "relative",
        width: style?.width || "100%",
        flex: style?.flex,
        display: "flex",
        background: isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent",
        transition: "background 0.15s ease",
      }}
    >
      <div
        ref={overlayRef}
        className={className}
        style={{
          ...style,
          position: "absolute",
          inset: 0,
          color: value ? "var(--text-primary)" : "var(--text-tertiary)",
          overflow: "hidden",
          whiteSpace: "pre",
          zIndex: 1,
          userSelect: isFocused ? "auto" : "none",
          background: "transparent",
        }}
        aria-hidden="true"
        onClick={() => inputRef.current?.focus()}
      >
        {value
          ? renderVariableHighlight({
              text: value,
              activeTab,
              collections,
              activeEnvironment,
              globalVariables,
              responseCache,
            })
          : placeholder}
      </div>
      <input
        ref={inputRef}
        className={`${className} variable-input-proxy`}
        style={{
          ...style,
          position: "relative",
          color: "transparent",
          caretColor: "var(--text-primary)",
          background: "transparent",
          pointerEvents: isFocused ? "auto" : "none",
          zIndex: 2,
        }}
        placeholder=""
        value={value}
        disabled={disabled}
        onPaste={onPaste}
        onBlur={() => {
          setIsFocused(false);
          autocomplete.handleBlur();
        }}
        onChange={autocomplete.handleChange}
        onClick={autocomplete.handleClick}
        onFocus={(e) => {
          setIsFocused(true);
          autocomplete.handleFocus(e);
        }}
        onMouseMove={hover.handleMouseMove}
        onMouseLeave={hover.handleMouseLeave}
        onKeyDown={(event) => {
          autocomplete.handleKeyDown(event);
        }}
        onKeyUp={autocomplete.handleKeyUp}
        onScroll={(event) => {
          if (overlayRef.current)
            overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
        spellCheck={false}
      />
      {!disabled && (
        <button
          type="button"
          onClick={() => setIsChainingOpen(true)}
          style={{
            position: "absolute",
            right: 4,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            borderRadius: "var(--radius-sm)",
            zIndex: 3,
            transition: "all var(--transition-fast)",
          }}
          title="Chain Request Response"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent-primary)";
            e.currentTarget.style.background = "var(--bg-tertiary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.background = "none";
          }}
        >
          <Link size={12} />
        </button>
      )}
      {autocomplete.autocompleteState && (
        <VariableAutocompletePopover
          activeIndex={autocomplete.activeIndex}
          suggestions={autocomplete.suggestions}
          x={autocomplete.autocompleteState.x}
          y={autocomplete.autocompleteState.y}
          onSelect={(suggestion) =>
            autocomplete.insertSuggestion(
              suggestion,
              document.activeElement as HTMLInputElement,
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
      {isChainingOpen && (
        <ChainingPickerModal
          onClose={() => setIsChainingOpen(false)}
          onSelect={(chainString) => {
            // Append to current value, or replace? Usually append or insert at cursor. For now, append.
            onChange(value ? value + chainString : chainString);
          }}
        />
      )}
    </div>
  );
}
