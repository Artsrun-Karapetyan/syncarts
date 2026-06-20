import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ScriptSuggestion } from "@/components/request/scripts/scriptAutocompleteData";
import { ScriptSuggestionKindBadge } from "@/components/request/scripts/ScriptSuggestionKindBadge";

interface ScriptAutocompletePopoverProps {
  activeIndex: number;
  onSelect: (suggestion: ScriptSuggestion) => void;
  suggestions: ScriptSuggestion[];
  x: number;
  y: number;
}

export function ScriptAutocompletePopover(
  props: ScriptAutocompletePopoverProps,
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
        width: 420,
        maxHeight: 260,
        overflowY: "auto",
        padding: 0,
        background: "rgba(29, 32, 27, 0.98)",
        border: "1px solid var(--border-highlight)",
        borderRadius: 6,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.label}-${suggestion.insertText}`}
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
            display: "grid",
            gridTemplateColumns: "18px minmax(105px, 1fr) minmax(96px, 140px)",
            gap: 6,
            alignItems: "center",
            padding: "4px 7px",
            border: 0,
            borderRadius: 0,
            background:
              index === activeIndex || index === hoveredIndex
                ? "rgba(139, 137, 113, 0.75)"
                : "transparent",
            color: "var(--text-primary)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <ScriptSuggestionKindBadge kind={suggestion.kind} />
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
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {suggestion.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-tertiary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {suggestion.detail}
            </span>
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            ({suggestion.kind}) {suggestion.typeText}
          </span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
