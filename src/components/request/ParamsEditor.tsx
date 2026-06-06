import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function ParamsEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [params, setParams] = useState<{key: string, value: string}[]>([{ key: '', value: '' }]);

  // Sync from URL to local state
  useEffect(() => {
    if (!activeTab) return;
    
    const [, queryString] = (activeTab.url || '').split('?');
    if (!queryString) {
      setParams(prev => {
        // Only wipe if there are valid params that shouldn't exist anymore
        if (prev.some(p => p.key || p.value)) return [{ key: '', value: '' }];
        return prev.length ? prev : [{ key: '', value: '' }];
      });
      return;
    }

    const parsed = queryString.split('&').map(pair => {
      const [k, v] = pair.split('=');
      return { key: decodeURIComponent(k || ''), value: decodeURIComponent(v || '') };
    });

    setParams(prev => {
      // Keep any trailing empty rows the user added
      const trailingEmptyCount = prev.slice().reverse().findIndex(p => p.key || p.value);
      const emptyCount = trailingEmptyCount === -1 ? prev.length : trailingEmptyCount;
      const emptyRows = Array(emptyCount).fill({ key: '', value: '' });
      
      const newParams = [...parsed, ...emptyRows];
      return newParams.length ? newParams : [{ key: '', value: '' }];
    });
  }, [activeTab?.url]);

  // Sync from local state to URL
  const syncUrl = (newParams: { key: string; value: string }[]) => {
    setParams(newParams); // Optimistic UI update
    if (!activeTab) return;
    
    const baseUrl = activeTab.url.split('?')[0] || '';
    const validParams = newParams.filter(p => p.key || p.value);
    
    if (validParams.length === 0) {
      updateActiveTab({ url: baseUrl });
      return;
    }

    const queryParts = validParams.map(p => 
      `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
    );
    
    updateActiveTab({ url: `${baseUrl}?${queryParts.join('&')}` });
  };

  const updateParam = (index: number, key: string, value: string) => {
    const newParams = [...params];
    newParams[index] = { key, value };
    syncUrl(newParams);
  };

  const addParam = () => {
    setParams(prev => [...prev, { key: '', value: '' }]);
  };

  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    if (newParams.length === 0) newParams.push({ key: '', value: '' });
    syncUrl(newParams);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {params.map((param, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input font-mono"
            style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
            placeholder="Key"
            value={param.key}
            onChange={(e) => updateParam(idx, e.target.value, param.value)}
            disabled={!activeTab}
          />
          <input
            className="input font-mono"
            style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
            placeholder="Value"
            value={param.value}
            onChange={(e) => updateParam(idx, param.key, e.target.value)}
            disabled={!activeTab}
          />
          <button
            type="button"
            style={{
              padding: 6,
              color: 'var(--status-delete)',
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)',
              opacity: activeTab ? 0.6 : 0.3,
              cursor: activeTab ? 'pointer' : 'not-allowed',
            }}
            onClick={() => { if (activeTab) removeParam(idx); }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--status-delete-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
            title="Remove Param"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '8px',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          background: 'transparent',
          cursor: activeTab ? 'pointer' : 'not-allowed',
          opacity: activeTab ? 1 : 0.5,
          fontSize: 13,
          fontWeight: 500,
          transition: 'all var(--transition-fast)',
        }}
        onClick={() => { if (activeTab) addParam(); }}
        onMouseEnter={(e) => {
          if (!activeTab) return;
          e.currentTarget.style.borderColor = 'var(--border-highlight)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }}
        onMouseLeave={(e) => {
          if (!activeTab) return;
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Plus size={14} /> Add Param
      </button>
    </div>
  );
}
