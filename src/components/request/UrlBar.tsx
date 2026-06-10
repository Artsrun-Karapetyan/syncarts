import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { parseCurlCommand } from '../../utils/curlParser';
import { syncPathVariablesWithUrl, upsertPathVariable } from '../../utils/pathVariables';
import { resolveScopedVariable, upsertActiveVariableValue } from './variableResolution';
import { UrlVariablePopover } from './UrlVariablePopover';

import './UrlBar.css';

const AUTO_REQUEST_NAMES = new Set(['Untitled Request', 'New Request']);
const PATH_VARIABLE_REGEX = /(^|\/):([A-Za-z_][A-Za-z0-9_]*)/g;
type HoveredUrlVariable = { kind: 'environment' | 'path', name: string, x: number, y: number, exists: boolean, hasValue: boolean, value?: string, source?: string };

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
  const popoverRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = activeTab?.url || '';
  
  const [hoveredVar, setHoveredVar] = useState<HoveredUrlVariable | null>(null);
  const activeCollection = activeTab?.collectionId ? collections.find((collection) => collection.id === activeTab.collectionId) : undefined;
  const resolveVariable = (varName: string) => {
    return resolveScopedVariable({ activeCollection, activeEnvironment, globalVariables, varName });
  };

  const clearHideTimeout = () => {
    if (!hideTimeout.current) return;
    clearTimeout(hideTimeout.current);
    hideTimeout.current = null;
  };

  const scheduleHidePopover = () => {
    clearHideTimeout();
    hideTimeout.current = setTimeout(() => {
      setHoveredVar(null);
      hideTimeout.current = null;
    }, 120);
  };

  useEffect(() => clearHideTimeout, []);

  useEffect(() => {
    if (!hoveredVar) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || inputRef.current?.contains(target)) return;
      setHoveredVar(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHoveredVar(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [hoveredVar]);

  useEffect(() => {
    // Auto-focus URL bar when a new/empty request is opened
    if (activeTab && activeTab.url === '') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [activeTab?.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!overlayRef.current) return;
    
    const spans = overlayRef.current.querySelectorAll('.env-var-span, .path-var-span');
    let found = false;
    
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement;
      const rect = span.getBoundingClientRect();
      
      // Check if mouse is within the span's bounding box
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        found = true;
        const varName = span.getAttribute('data-varname') || '';
        const kind = (span.getAttribute('data-kind') === 'path' ? 'path' : 'environment') as HoveredUrlVariable['kind'];
        const exists = span.getAttribute('data-exists') === 'true';
        const hasValue = span.getAttribute('data-has-value') === 'true';
        const value = span.getAttribute('data-value') || '';
        const source = span.getAttribute('data-source') || '';
        
        if (hoveredVar?.name !== varName || hoveredVar?.kind !== kind || hoveredVar?.hasValue !== hasValue) {
          clearHideTimeout();
          setHoveredVar({ kind, name: varName, x: rect.left, y: rect.bottom + 4, exists, hasValue, value, source });
        }
        break;
      }
    }
    
    if (!found && hoveredVar) scheduleHidePopover();
  };

  const handleMouseLeave = () => {
    if (hoveredVar) scheduleHidePopover();
  };

  const handleAddVar = (varName: string, value: string) => {
    if (hoveredVar?.kind === 'path') {
      updateActiveTab({ pathVariables: upsertPathVariable(activeTab?.pathVariables || [], varName, value) });
      setHoveredVar(null);
      return;
    }

    if (activeCollection) {
      updateCollection(activeCollection.id, { variables: upsertActiveVariableValue(activeCollection.variables || [], varName, value) });
      setHoveredVar(null);
      return;
    }

    if (activeEnvironmentId === 'globals') {
      updateGlobalVariables(upsertActiveVariableValue(globalVariables, varName, value));
      setHoveredVar(null);
      return;
    }

    if (!activeEnvironment) {
      alert("Please select an Environment or Globals first (top right corner).");
      return;
    }
    updateEnvironment(activeEnvironment.id, { variables: upsertActiveVariableValue(activeEnvironment.variables, varName, value) });
    setHoveredVar(null);
  };

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

  const openCollectionVariables = () => {
    if (!activeCollection) return;
    setHoveredVar(null);
    openCollectionTab(activeCollection.id, 'variables');
  };

  const openPathVariables = () => {
    setHoveredVar(null);
    window.dispatchEvent(new CustomEvent('syncarts:open-request-tab', { detail: { tab: 'params' } }));
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
        onChange={(e) => {
          const newUrl = e.target.value;
          const updates: any = {
            url: newUrl,
            pathVariables: syncPathVariablesWithUrl(newUrl, activeTab?.pathVariables || [])
          };
          if (!activeTab?.name || AUTO_REQUEST_NAMES.has(activeTab.name) || activeTab.name === activeTab.url) {
            updates.name = newUrl;
          }
          updateActiveTab(updates);
        }}
        onScroll={(e) => {
          if (overlayRef.current) {
            overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && url) {
            sendRequest();
          }
          if (e.key === 'Escape') {
            setHoveredVar(null);
          }
        }}
        onPaste={handlePaste}
        disabled={!activeTab}
        spellCheck={false}
      />

      {hoveredVar && (
        <UrlVariablePopover
          hoveredVar={hoveredVar}
          popoverRef={popoverRef}
          onSave={handleAddVar}
          onMouseEnter={clearHideTimeout}
          onMouseLeave={handleMouseLeave}
          onOpenCollectionVariables={openCollectionVariables}
          onOpenPathVariables={openPathVariables}
          canOpenCollectionVariables={!!activeCollection}
          variableTargetLabel={activeCollection ? 'Collection' : 'Environment'}
        />
      )}
    </div>
  );
}
