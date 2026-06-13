import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { VariableSuggestion } from "./variableAutocompleteTypes";
import { VariableSourceBadge } from "./VariableSourceBadge";

interface VariableAutocompletePopoverProps {
  activeIndex: number;
  onSelect: (suggestion: VariableSuggestion) => void;
  suggestions: VariableSuggestion[];
  x: number;
  y: number;
}

export function VariableAutocompletePopover(
  props: VariableAutocompletePopoverProps,
) {
  const { activeIndex, onSelect, suggestions, x, y } = props;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (suggestions.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 999999,
        width: 320,
        overflow: "visible",
        padding: 4,
        background: "rgba(29, 32, 27, 0.98)",
        border: "1px solid var(--border-highlight)",
        borderRadius: 6,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.source}-${suggestion.key}-${suggestion.value}`}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(suggestion);
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              border: 0,
              borderRadius: 6,
              background:
                index === activeIndex || index === hoveredIndex
                  ? "rgba(139, 137, 113, 0.75)"
                  : "transparent",
              color: "var(--text-primary)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <VariableSourceBadge source={suggestion.source} />
            <span
              style={{
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {suggestion.key}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {suggestion.value || "empty"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
