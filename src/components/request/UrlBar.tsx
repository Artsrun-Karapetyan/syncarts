import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { parseCurlCommand } from '../../utils/curlParser';
import { resolveScopedVariable, upsertActiveVariableValue } from './variableResolution';

import './UrlBar.css';

const AUTO_REQUEST_NAMES = new Set(['Untitled Request', 'New Request']);

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
  const hideTimeout = useRef<any>(null);
  const url = activeTab?.url || '';
  
  const [hoveredVar, setHoveredVar] = useState<{ name: string, x: number, y: number, exists: boolean, hasValue: boolean, value?: string, source?: string } | null>(null);
  const activeCollection = activeTab?.collectionId ? collections.find((collection) => collection.id === activeTab.collectionId) : undefined;
  const resolveVariable = (varName: string) => {
    return resolveScopedVariable({ activeCollection, activeEnvironment, globalVariables, varName });
  };

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
    
    const spans = overlayRef.current.querySelectorAll('.env-var-span');
    let found = false;
    
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement;
      const rect = span.getBoundingClientRect();
      
      // Check if mouse is within the span's bounding box
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        found = true;
        const varName = span.getAttribute('data-varname') || '';
        const exists = span.getAttribute('data-exists') === 'true';
        const hasValue = span.getAttribute('data-has-value') === 'true';
        const value = span.getAttribute('data-value') || '';
        const source = span.getAttribute('data-source') || '';
        
        if (hoveredVar?.name !== varName || hoveredVar?.hasValue !== hasValue) {
          clearTimeout(hideTimeout.current);
          setHoveredVar({ name: varName, x: rect.left, y: rect.bottom + 4, exists, hasValue, value, source });
        }
        break;
      }
    }
    
    if (!found) clearTimeout(hideTimeout.current);
  };

  const handleMouseLeave = () => {
    clearTimeout(hideTimeout.current);
  };

  const handleAddVar = (varName: string, value: string) => {
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
      return <span key={i}>{part}</span>;
    });
  };

  const openCollectionVariables = () => {
    if (!activeCollection) return;
    setHoveredVar(null);
    openCollectionTab(activeCollection.id, 'variables');
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
          const updates: any = { url: newUrl };
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

      {/* Popover */}
      {hoveredVar && createPortal(
        <div 
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: hoveredVar.x,
            top: hoveredVar.y,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: 0,
            zIndex: 999999,
            boxShadow: 'var(--shadow-lg)',
            minWidth: 340,
            overflow: 'hidden',
            fontSize: 13,
            color: 'var(--text-primary)'
          }}
          onMouseEnter={() => clearTimeout(hideTimeout.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ padding: '14px 16px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              id="new-env-var-input"
              className="input"
              style={{ fontSize: 13, padding: '8px 10px', height: 36 }}
              defaultValue={hoveredVar.value || ''}
              placeholder="Enter value"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddVar(hoveredVar.name, e.currentTarget.value);
              }}
            />
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                const input = document.getElementById('new-env-var-input') as HTMLInputElement;
                handleAddVar(hoveredVar.name, input?.value || '');
              }}
            >
              <Plus size={14} /> {hoveredVar.exists ? 'Update' : 'Add'} {activeCollection ? 'Collection' : 'Environment'} Variable
            </button>
          </div>
          <button
            type="button"
            onClick={openCollectionVariables}
            disabled={!activeCollection}
            style={{
              width: '100%',
              border: 0,
              borderTop: '1px solid var(--border-color)',
              background: 'transparent',
              color: activeCollection ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: activeCollection ? 'pointer' : 'default',
              fontSize: 13
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, background: '#9b7200', color: '#fff0a8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                C
              </span>
              Collection
            </span>
            <span>Variables in request -&gt;</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
