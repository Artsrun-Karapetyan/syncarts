import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { parseCurlCommand } from '../../utils/curlParser';

import './UrlBar.css';

export function UrlBar() {
  const { activeTab, updateActiveTab, sendRequest, activeEnvironment, updateEnvironment } = useWorkspace();

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
  const hideTimeout = useRef<any>(null);
  const url = activeTab?.url || '';
  
  const [hoveredVar, setHoveredVar] = useState<{ name: string, x: number, y: number, exists: boolean, value?: string } | null>(null);

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
        const value = span.getAttribute('data-value') || '';
        
        if (hoveredVar?.name !== varName) {
          clearTimeout(hideTimeout.current);
          setHoveredVar({ name: varName, x: rect.left, y: rect.bottom + 4, exists, value });
        }
        break;
      }
    }
    
    if (!found && hoveredVar) {
      hideTimeout.current = setTimeout(() => setHoveredVar(null), 150);
    }
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setHoveredVar(null), 150);
  };

  const handleAddVar = (varName: string, value: string) => {
    if (!activeEnvironment) {
      alert("Please create or select an Environment first (top right corner).");
      return;
    }
    const newVars = [...activeEnvironment.variables, { id: crypto.randomUUID(), key: varName, value, enabled: true, type: 'text' as const }];
    updateEnvironment(activeEnvironment.id, { variables: newVars });
    setHoveredVar(null);
  };

  const renderHighlighted = () => {
    const parts = url.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.substring(2, part.length - 2);
        const exists = activeEnvironment?.variables.some(v => v.key === varName && v.enabled);
        
        const value = activeEnvironment?.variables.find(v => v.key === varName)?.value;
        return (
          <span 
            key={i} 
            className="env-var-span"
            data-varname={varName}
            data-exists={exists}
            data-value={value || ''}
            style={{ 
              color: exists ? 'var(--accent-primary)' : 'var(--status-delete)', 
              fontWeight: 600,
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
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
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          whiteSpace: 'pre',
          zIndex: 1,
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
        }}
        value={url}
        onChange={(e) => updateActiveTab({ url: e.target.value })}
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
        }}
        onPaste={handlePaste}
        disabled={!activeTab}
        spellCheck={false}
      />

      {/* Popover */}
      {hoveredVar && createPortal(
        <div 
          style={{
            position: 'fixed',
            left: hoveredVar.x,
            top: hoveredVar.y,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            zIndex: 999999,
            boxShadow: 'var(--shadow-lg)',
            minWidth: 200,
            fontSize: 13,
            color: 'var(--text-primary)'
          }}
          onMouseEnter={() => clearTimeout(hideTimeout.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            Environment Variable
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', marginBottom: hoveredVar.exists ? 0 : 12, fontWeight: 600, color: hoveredVar.exists ? 'var(--accent-primary)' : 'var(--status-delete)' }}>
            {hoveredVar.name}
          </div>
          
          {hoveredVar.exists ? (
            <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 11, marginRight: 4 }}>Value:</span>
              {hoveredVar.value || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>empty</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input 
                id="new-env-var-input"
                className="input" 
                style={{ fontSize: 12, padding: '4px 8px', height: 28 }} 
                placeholder="Initial Value..." 
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddVar(hoveredVar.name, e.currentTarget.value);
                }}
              />
              <button 
                className="btn" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={(e) => {
                  const input = document.getElementById('new-env-var-input') as HTMLInputElement;
                  handleAddVar(hoveredVar.name, input?.value || '');
                }}
              >
                <Plus size={14} /> Add to Environment
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
