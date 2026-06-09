import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { resolveRequestAuth } from '../../contexts/workspace/requestHelpers';
import { AuthTokenInput, type HoveredVariable } from './AuthTokenInput';
import { resolveScopedVariable, upsertActiveVariableValue } from './variableResolution';
import { Select } from '../ui/Select';

type AuthType = 'inherit' | 'none' | 'bearer';

export function AuthEditor() {
  const { activeTab, updateActiveTab, activeEnvironment, updateEnvironment, collections, globalVariables, updateCollection, openCollectionTab } = useWorkspace();
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<any>(null);
  const [hoveredVar, setHoveredVar] = useState<HoveredVariable | null>(null);
  
  // Determine current auth state based on activeTab
  const currentType: AuthType = activeTab?.authType || 'inherit';
  const currentToken = activeTab?.bearerToken || '';
  const resolvedAuth = resolveRequestAuth(activeTab, collections);
  const displayedToken = currentType === 'inherit' ? resolvedAuth.bearerToken : currentToken;
  const activeCollection = activeTab?.collectionId ? collections.find(c => c.id === activeTab.collectionId) : undefined;

  const handleTypeChange = (type: AuthType) => {
    if (!activeTab) return;
    updateActiveTab({ authType: type });
  };

  const handleTokenChange = (token: string) => {
    if (!activeTab) return;
    updateActiveTab({ bearerToken: token });
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setHoveredVar(null), 150);
  };

  const handleAddVar = (varName: string, value: string) => {
    if (activeCollection) {
      updateCollection(activeCollection.id, { variables: upsertActiveVariableValue(activeCollection.variables || [], varName, value) });
      setHoveredVar(null);
      return;
    }

    if (!activeEnvironment) {
      alert("Please create or select an Environment first.");
      return;
    }
    updateEnvironment(activeEnvironment.id, { variables: upsertActiveVariableValue(activeEnvironment.variables, varName, value) });
    setHoveredVar(null);
  };

  const resolveVariable = (varName: string) => {
    return resolveScopedVariable({ activeCollection, activeEnvironment, globalVariables, varName });
  };

  const openCollectionVariables = () => {
    if (!activeCollection) return;
    setHoveredVar(null);
    openCollectionTab(activeCollection.id, 'variables');
  };

  const renderHighlighted = (token: string) => {
    const parts = token.split(/(\{\{[^}]*\}\})/g);
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
            data-source={resolved.source || ''}
            style={{ color: resolved.hasValue ? 'var(--accent-primary)' : 'var(--status-delete)' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            This request will inherit authentication from its parent folder or collection.
          </div>
          {resolvedAuth.authType === 'bearer' && (
            <AuthTokenInput
              disabled
              hideTimeout={hideTimeout}
              hoveredVar={hoveredVar}
              label={`Bearer Token${resolvedAuth.inheritedFrom ? ` from ${resolvedAuth.inheritedFrom.name}` : ''}`}
              overlayRef={overlayRef}
              renderHighlighted={() => renderHighlighted(displayedToken)}
              setHoveredVar={setHoveredVar}
              token={displayedToken}
              onChange={() => undefined}
            />
          )}
        </div>
      )}

      {currentType === 'none' && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          This request does not use any authorization.
        </div>
      )}

      {currentType === 'bearer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AuthTokenInput
            disabled={!activeTab}
            hideTimeout={hideTimeout}
            hoveredVar={hoveredVar}
            label="Token"
            overlayRef={overlayRef}
            renderHighlighted={() => renderHighlighted(currentToken)}
            setHoveredVar={setHoveredVar}
            token={currentToken}
            onChange={handleTokenChange}
          />
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
              id={`auth-env-var-input-${hoveredVar.name}`}
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
                const input = document.getElementById(`auth-env-var-input-${hoveredVar.name}`) as HTMLInputElement;
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
