import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Select } from '../ui/Select';

type AuthType = 'inherit' | 'none' | 'bearer';

export function AuthEditor() {
  const { activeTab, updateActiveTab, activeEnvironment, updateEnvironment } = useWorkspace();
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<any>(null);
  const [hoveredVar, setHoveredVar] = useState<{ name: string, x: number, y: number, exists: boolean, value?: string } | null>(null);
  
  // Determine current auth state based on activeTab
  const currentType: AuthType = activeTab?.authType || 'inherit';
  const currentToken = activeTab?.bearerToken || '';

  const handleTypeChange = (type: AuthType) => {
    if (!activeTab) return;
    updateActiveTab({ authType: type });
  };

  const handleTokenChange = (token: string) => {
    if (!activeTab) return;
    updateActiveTab({ bearerToken: token });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!overlayRef.current) return;
    const spans = overlayRef.current.querySelectorAll('.env-var-span');
    let found = false;
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement;
      const rect = span.getBoundingClientRect();
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
      alert("Please create or select an Environment first.");
      return;
    }
    const newVars = [...activeEnvironment.variables, { id: crypto.randomUUID(), key: varName, value, enabled: true, type: 'text' as const }];
    updateEnvironment(activeEnvironment.id, { variables: newVars });
    setHoveredVar(null);
  };

  const renderHighlighted = () => {
    const parts = currentToken.split(/(\{\{[^}]*\}\})/g);
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
            style={{ color: exists ? 'var(--accent-primary)' : 'var(--status-delete)' }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Auth Type
        </label>
        <Select
          style={{ width: 200, fontSize: 13 }}
          value={currentType}
          onChange={(val) => handleTypeChange(val as AuthType)}
          disabled={!activeTab}
          options={[
            { label: 'Inherit auth from parent', value: 'inherit' },
            { label: 'No Auth', value: 'none' },
            { label: 'Bearer Token', value: 'bearer' }
          ]}
        />
      </div>

      <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.5 }} />

      {currentType === 'inherit' && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          This request will inherit authentication from its parent folder or collection.
        </div>
      )}

      {currentType === 'none' && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          This request does not use any authorization.
        </div>
      )}

      {currentType === 'bearer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Token
          </label>
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <div 
              ref={overlayRef}
              className="input font-mono"
              style={{ 
                position: 'absolute', 
                inset: 0, 
                pointerEvents: 'none', 
                color: currentToken ? 'var(--text-primary)' : 'var(--text-tertiary)',
                opacity: currentToken ? 1 : 0.6,
                overflow: 'hidden',
                whiteSpace: 'pre',
                zIndex: 1,
                fontSize: 13, padding: '10px 14px'
              }}
              aria-hidden="true"
            >
              {currentToken ? renderHighlighted() : "e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6..."}
            </div>

            <input
              className="input font-mono"
              style={{ 
                width: '100%', 
                fontSize: 13, 
                padding: '10px 14px',
                color: 'transparent',
                caretColor: 'var(--text-primary)',
                background: 'transparent',
                zIndex: 2,
              }}
              value={currentToken}
              onChange={(e) => handleTokenChange(e.target.value)}
              onScroll={(e) => {
                if (overlayRef.current) overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              disabled={!activeTab}
              spellCheck={false}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
            The authorization header will be automatically generated when you send the request.
          </div>
          {activeTab?.type !== 'collection' && activeTab?.type !== 'folder' && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ padding: 4, background: 'var(--bg-secondary)', borderRadius: 6, color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </div>
              <div>
                <strong>Tip:</strong> If you manually added an Authorization header in the Headers tab, you should remove it so it doesn't conflict with this setting.
              </div>
            </div>
          )}
        </div>
      )}
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
                id={`auth-env-var-input-${hoveredVar.name}`}
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
                onClick={() => {
                  const input = document.getElementById(`auth-env-var-input-${hoveredVar.name}`) as HTMLInputElement;
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
