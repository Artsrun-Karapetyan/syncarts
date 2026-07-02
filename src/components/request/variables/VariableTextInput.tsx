import { Link } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";

import { ChainingPickerModal } from "@/components/request/chaining/ChainingPickerModal";
import { UrlVariablePopover } from "@/components/request/url/UrlVariablePopover";
import { useVariableAutocomplete } from "@/components/request/variables/useVariableAutocomplete";
import { useVariableHover } from "@/components/request/variables/useVariableHover";
import { VariableAutocompletePopover } from "@/components/request/variables/VariableAutocompletePopover";
import { renderVariableHighlight } from "@/components/request/variables/variableHighlight";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface VariableTextInputProps {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  value: string;
  onChange: (value: string) => void;
  onPaste?: (event: React.ClipboardEvent<any>) => void;
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const externalPaddingRight = style?.paddingRight
    ? parseInt(style.paddingRight.toString(), 10)
    : 0;
  const linkIconRight = externalPaddingRight ? externalPaddingRight + 4 : 4;
  const totalPaddingRight = disabled
    ? externalPaddingRight
    : externalPaddingRight + 28;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // maintain single-line submission behavior
    }
    autocomplete.handleKeyDown(event as any);
  };

  return (
    <div
      data-selection-id={selectionId}
      style={{
        position: "relative",
        width: style?.width || "100%",
        flex: style?.flex,
        display: "grid",
        background: isSelected ? "rgba(139, 92, 246, 0.15)" : "transparent",
        transition: "background 0.15s ease",
        maxHeight: isFocused ? 120 : undefined,
        overflowY: isFocused ? "auto" : "hidden",
      }}
    >
      <div
        ref={overlayRef}
        className={className}
        style={{
          ...style,
          gridArea: "1 / 1",
          color: value ? "var(--text-primary)" : "var(--text-tertiary)",
          overflow: "hidden",
          whiteSpace: isFocused ? "pre-wrap" : "pre",
          wordBreak: isFocused ? "break-all" : "normal",
          zIndex: 1,
          userSelect: isFocused ? "auto" : "none",
          background: "transparent",
          paddingRight: totalPaddingRight,
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
        {/* Trailing newline ensures div height matches textarea exactly when focused */}
        {isFocused && "\n"}
      </div>
      <textarea
        ref={inputRef}
        className={`${className} variable-input-proxy`}
        style={{
          ...style,
          gridArea: "1 / 1",
          color: "transparent",
          caretColor: "var(--text-primary)",
          background: "transparent",
          pointerEvents: isFocused ? "auto" : "none",
          zIndex: 2,
          resize: "none",
          overflow: "hidden",
          whiteSpace: isFocused ? "pre-wrap" : "pre",
          wordBreak: isFocused ? "break-all" : "normal",
          paddingRight: totalPaddingRight,
        }}
        rows={1}
        placeholder=""
        value={value}
        disabled={disabled}
        onPaste={onPaste}
        onBlur={() => {
          setIsFocused(false);
          autocomplete.handleBlur();
        }}
        onChange={(e) => autocomplete.handleChange(e as any)}
        onClick={(e) => autocomplete.handleClick(e as any)}
        onFocus={(e) => {
          setIsFocused(true);
          autocomplete.handleFocus(e as any);
        }}
        onMouseMove={(e) => hover.handleMouseMove(e as any)}
        onMouseLeave={() => hover.handleMouseLeave()}
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => autocomplete.handleKeyUp(e as any)}
        onScroll={(event) => {
          if (overlayRef.current) {
            overlayRef.current.scrollTop = event.currentTarget.scrollTop;
            overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }
        }}
        spellCheck={false}
      />
      {!disabled && (
        <button
          type="button"
          onClick={() => setIsChainingOpen(true)}
          style={{
            position: "absolute",
            right: linkIconRight,
            top: isFocused && value.length > 50 ? 8 : "50%",
            transform:
              isFocused && value.length > 50 ? "none" : "translateY(-50%)",
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
