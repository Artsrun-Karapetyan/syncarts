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
  
  // Find existing authorization header
  const authHeaderIndex = activeTab?.headers.findIndex(h => h.key.toLowerCase() === 'authorization') ?? -1;
  const authHeader = authHeaderIndex !== -1 && activeTab ? activeTab.headers[authHeaderIndex] : null;

  // Determine current auth state based on headers and authType
  let currentType: AuthType = activeTab?.authType || 'inherit';
  let currentToken = '';

  if (authHeader) {
    if (authHeader.value.startsWith('Bearer ')) {
      currentType = 'bearer';
      currentToken = authHeader.value.substring(7);
    }
    // We could add Basic auth detection here later
  }

  const handleTypeChange = (type: AuthType) => {
    if (!activeTab) return;
    
    let newHeaders = [...activeTab.headers];
    
    if (type === 'none' || type === 'inherit') {
      // Remove the Authorization header if we switch to none/inherit
      if (authHeaderIndex !== -1) {
        newHeaders.splice(authHeaderIndex, 1);
        // Ensure at least one empty row remains
        if (newHeaders.length === 0) newHeaders.push({ key: '', value: '' });
      }
      updateActiveTab({ headers: newHeaders, authType: type });
    } else if (type === 'bearer') {
      // Switch to bearer, insert or update header
      const bearerValue = `Bearer ${currentToken}`;
      if (authHeaderIndex !== -1) {
        newHeaders[authHeaderIndex] = { key: 'Authorization', value: bearerValue };
      } else {
        // Find the first empty row to replace, or push
        const emptyIndex = newHeaders.findIndex(h => !h.key && !h.value);
        if (emptyIndex !== -1) {
          newHeaders[emptyIndex] = { key: 'Authorization', value: bearerValue };
        } else {
          newHeaders.push({ key: 'Authorization', value: bearerValue });
        }
      }
      updateActiveTab({ headers: newHeaders, authType: type });
    }
  };

  const handleTokenChange = (token: string) => {
    if (!activeTab || currentType !== 'bearer') return;
    
    let newHeaders = [...activeTab.headers];
    const bearerValue = `Bearer ${token}`;
    
    if (authHeaderIndex !== -1) {
      newHeaders[authHeaderIndex] = { key: 'Authorization', value: bearerValue };
    } else {
      const emptyIndex = newHeaders.findIndex(h => !h.key && !h.value);
      if (emptyIndex !== -1) {
        newHeaders[emptyIndex] = { key: 'Authorization', value: bearerValue };
      } else {
        newHeaders.push({ key: 'Authorization', value: bearerValue });
      }
    }
    updateActiveTab({ headers: newHeaders });
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
            { value: 'inherit', label: 'Inherit auth from parent' },
            { value: 'none', label: 'No Auth' },
            { value: 'bearer', label: 'Bearer Token' }
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
            The token will be automatically added to the Headers tab as <strong>Authorization: Bearer &lt;token&gt;</strong>.
          </div>
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
