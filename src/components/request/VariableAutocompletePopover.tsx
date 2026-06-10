import { createPortal } from 'react-dom';
import { useState } from 'react';

import type { VariableSuggestion } from './variableAutocompleteTypes';
import { VariableSourceBadge } from './VariableSourceBadge';

interface VariableAutocompletePopoverProps {
  activeIndex: number;
  onSelect: (suggestion: VariableSuggestion) => void;
  suggestions: VariableSuggestion[];
  x: number;
  y: number;
}

export function VariableAutocompletePopover(props: VariableAutocompletePopoverProps) {
  const { activeIndex, onSelect, suggestions, x, y } = props;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  if (suggestions.length === 0) return null;

  const hoveredSuggestion = hoveredIndex === null ? null : suggestions[hoveredIndex];
  const showPreviewOnLeft = typeof window !== 'undefined' && x + 704 > window.innerWidth;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 999999,
        width: 360,
        overflow: 'visible',
        padding: 8,
        background: 'rgba(28, 28, 28, 0.98)',
        border: '1px solid var(--border-highlight)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.source}-${suggestion.key}-${index}`}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(suggestion);
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              border: 0,
              borderRadius: 8,
              background: index === activeIndex || index === hoveredIndex ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <VariableSourceBadge source={suggestion.source} />
            <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {suggestion.key}
              </span>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {suggestion.value || 'empty'}
              </span>
            </span>
          </button>
        ))}
      </div>
      {hoveredSuggestion && (
        <div
          style={{
            position: 'absolute',
            left: showPreviewOnLeft ? -336 : 376,
            top: Math.min(hoveredIndex ?? 0, 6) * 58 + 8,
            width: 320,
            padding: 12,
            background: 'rgba(32, 32, 32, 0.98)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--text-primary)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <VariableSourceBadge source={hoveredSuggestion.source} />
            <strong style={{ fontSize: 13 }}>{hoveredSuggestion.key}</strong>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
            {hoveredSuggestion.source} variable
          </div>
          <div
            className="font-mono"
            style={{
              maxHeight: 160,
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: 12,
              lineHeight: 1.5,
              color: hoveredSuggestion.value ? 'var(--text-secondary)' : 'var(--text-tertiary)',
            }}
          >
            {hoveredSuggestion.value || 'empty'}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
