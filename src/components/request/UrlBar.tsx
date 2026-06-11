import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { parseCurlCommand } from '../../utils/curlParser';
import { syncPathVariablesWithUrl, upsertPathVariable } from '../../utils/pathVariables';
import { resolveScopedVariable, upsertActiveVariableValue } from './variableResolution';
import { UrlVariablePopover } from './UrlVariablePopover';
import { VariableAutocompletePopover } from './VariableAutocompletePopover';
import { useVariableAutocomplete } from './useVariableAutocomplete';
import { useVariableHover } from './useVariableHover';

import './UrlBar.css';

const AUTO_REQUEST_NAMES = new Set(['Untitled Request', 'New Request']);
const PATH_VARIABLE_REGEX = /(^|\/):([A-Za-z_][A-Za-z0-9_]*)/g;

export function UrlBar() {
  const {
    activeTab,
    updateActiveTab,
    sendRequest,
    activeEnvironmentId,
    activeEnvironment,
    updateEnvironment,
    collections,
    globalVariables,
    updateGlobalVariables,
    updateCollection,
    openCollectionTab
  } = useWorkspace();

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.trim().toLowerCase().startsWith('curl ')) {
      const parsed = parseCurlCommand(text);
      if (parsed) {
        e.preventDefault(); // Prevent pasting just the curl string into the URL
        updateActiveTab(parsed);
      }
    }
  };

  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = activeTab?.url || '';
  
  const hover = useVariableHover(overlayRef);
  const activeCollection = activeTab?.collectionId ? collections.find((collection) => collection.id === activeTab.collectionId) : undefined;
  const resolveVariable = (varName: string) => {
    return resolveScopedVariable({ activeCollection, activeEnvironment, globalVariables, varName });
  };
  const updateUrlValue = (newUrl: string) => {
    const updates: any = {
      url: newUrl,
      pathVariables: syncPathVariablesWithUrl(newUrl, activeTab?.pathVariables || [])
    };
    if (!activeTab?.name || AUTO_REQUEST_NAMES.has(activeTab.name) || activeTab.name === activeTab.url) {
      updates.name = newUrl;
    }
    updateActiveTab(updates);
  };
  const autocomplete = useVariableAutocomplete({ value: url, onChange: updateUrlValue });



  useEffect(() => {
    // Auto-focus URL bar when a new/empty request is opened
    if (activeTab && activeTab.url === '') {
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
      const variable = activeTab?.pathVariables?.find((item) => item.key === key);
      const value = variable?.value || '';

      if (tokenStart > lastIndex) nodes.push(<span key={`${baseKey}-t-${lastIndex}`}>{part.slice(lastIndex, tokenStart)}</span>);
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
          style={{ color: value ? 'var(--accent-primary)' : 'var(--status-delete)' }}
        >
          :{key}
        </span>
      );
      lastIndex = tokenEnd;
    }

    if (lastIndex < part.length) nodes.push(<span key={`${baseKey}-t-end`}>{part.slice(lastIndex)}</span>);
    return nodes;
  };

  const renderHighlighted = () => {
    const parts = url.split(/(\{\{[^}]*\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.substring(2, part.length - 2);
        const resolved = resolveVariable(varName);
        return (
          <span 
            key={i} 
            className="env-var-span"
            data-kind="environment"
            data-varname={varName}
            data-exists={resolved.exists}
            data-has-value={resolved.hasValue}
            data-value={resolved.value || ''}
            data-source={resolved.source}
            style={{ 
              color: resolved.hasValue ? 'var(--accent-primary)' : 'var(--status-delete)',
            }}
          >
            {part}
          </span>
        );
      }
      return renderPathVariables(part, String(i));
    });
  };



  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', height: 38, overflow: 'hidden', borderRadius: 9999 }}>
      {/* Overlay for highlighting */}
      <div 
        ref={overlayRef}
        className="url-input font-mono" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          pointerEvents: 'none', 
          color: url ? 'var(--text-primary)' : 'var(--text-tertiary)',
          opacity: url ? 1 : 0.6,
          overflow: 'hidden',
          whiteSpace: 'pre',
          zIndex: 1,
          lineHeight: '38px',
        }}
        aria-hidden="true"
      >
        {url ? renderHighlighted() : "https://api.example.com/v1/users (or paste cURL)"}
      </div>

      {/* Actual Input */}
      <input 
        ref={inputRef}
        className="url-input font-mono" 
        style={{ 
          position: 'absolute', 
          inset: 0,
          color: 'transparent',
          caretColor: 'var(--text-primary)',
          background: 'transparent',
          zIndex: 2,
          lineHeight: '38px',
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
          if (e.key === 'Enter' && url) {
            sendRequest();
          }
          if (e.key === 'Escape') {
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
          onMouseEnter={hover.clearHideTimeout}
          onMouseLeave={hover.handleMouseLeave}
          onOpenCollectionVariables={hover.openCollectionVariables}
          onOpenPathVariables={hover.openPathVariables}
          canOpenCollectionVariables={!!hover.activeCollection}
          variableTargetLabel={hover.activeCollection ? 'Collection' : 'Environment'}
        />
      )}
      {autocomplete.autocompleteState && (
        <VariableAutocompletePopover
          activeIndex={autocomplete.activeIndex}
          suggestions={autocomplete.suggestions}
          x={autocomplete.autocompleteState.x}
          y={autocomplete.autocompleteState.y}
          onSelect={suggestion => autocomplete.insertSuggestion(suggestion, inputRef.current)}
        />
      )}
    </div>
  );
}
