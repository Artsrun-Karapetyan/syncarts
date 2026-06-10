import { useRef } from 'react';
import type { CSSProperties } from 'react';

import { useWorkspace } from '../../contexts/WorkspaceContext';
import { renderVariableHighlight } from './variableHighlight';
import { VariableAutocompletePopover } from './VariableAutocompletePopover';
import { useVariableAutocomplete } from './useVariableAutocomplete';

interface VariableTextInputProps {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  value: string;
  onChange: (value: string) => void;
}

export function VariableTextInput(props: VariableTextInputProps) {
  const { className = 'input', disabled, placeholder, style, value, onChange } = props;
  const { activeEnvironment, activeTab, collections, globalVariables } = useWorkspace();
  const activeCollection = activeTab?.collectionId ? collections.find(collection => collection.id === activeTab.collectionId) : undefined;
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const autocomplete = useVariableAutocomplete({ value, onChange });

  return (
    <div style={{ position: 'relative', width: style?.width || '100%', flex: style?.flex, display: 'flex' }}>
      <div
        ref={overlayRef}
        className={className}
        style={{
          ...style,
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          overflow: 'hidden',
          whiteSpace: 'pre',
          zIndex: 1,
        }}
        aria-hidden="true"
      >
        {value ? renderVariableHighlight({ activeCollection, activeEnvironment, globalVariables, text: value }) : placeholder}
      </div>
      <input
        className={className}
        style={{
          ...style,
          position: 'relative',
          color: 'transparent',
          caretColor: 'var(--text-primary)',
          background: 'transparent',
          zIndex: 2,
        }}
        placeholder=""
        value={value}
        disabled={disabled}
        onBlur={autocomplete.handleBlur}
        onChange={autocomplete.handleChange}
        onClick={autocomplete.handleClick}
        onFocus={autocomplete.handleFocus}
        onKeyDown={(event) => {
          autocomplete.handleKeyDown(event);
        }}
        onKeyUp={autocomplete.handleKeyUp}
        onScroll={(event) => {
          if (overlayRef.current) overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
        spellCheck={false}
      />
      {autocomplete.autocompleteState && (
        <VariableAutocompletePopover
          activeIndex={autocomplete.activeIndex}
          suggestions={autocomplete.suggestions}
          x={autocomplete.autocompleteState.x}
          y={autocomplete.autocompleteState.y}
          onSelect={suggestion => autocomplete.insertSuggestion(suggestion, document.activeElement as HTMLInputElement)}
        />
      )}
    </div>
  );
}
