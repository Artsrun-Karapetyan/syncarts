import { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Select } from '../ui/Select';

type AuthType = 'inherit' | 'none' | 'bearer';

export function AuthEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  
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
          <input
            className="input font-mono"
            style={{ width: '100%', fontSize: 13, padding: '10px 14px' }}
            placeholder="e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={currentToken}
            onChange={(e) => handleTokenChange(e.target.value)}
            disabled={!activeTab}
            spellCheck={false}
          />
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
            The token will be automatically added to the Headers tab as <strong>Authorization: Bearer &lt;token&gt;</strong>.
          </div>
        </div>
      )}
    </div>
  );
}
