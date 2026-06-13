import { Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { VariableTextInput } from './VariableTextInput';

export function HeadersEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const headers = activeTab?.headers || [];

  const updateHeader = (index: number, updates: Partial<(typeof headers)[number]>) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], ...updates };
    updateActiveTab({ headers: newHeaders });
  };

  const addHeader = () => {
    updateActiveTab({ headers: [...headers, { key: '', value: '' }] });
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    if (newHeaders.length === 0) newHeaders.push({ key: '', value: '' });
    updateActiveTab({ headers: newHeaders });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {headers.map((header, idx) => (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 32px', gap: 8, alignItems: 'center' }}>
          <VariableTextInput
            className="input font-mono"
            style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}
            placeholder="Key (e.g. Authorization)"
            value={header.key}
            onChange={(value) => updateHeader(idx, { key: value })}
            disabled={!activeTab}
          />
          <VariableTextInput
            className="input font-mono"
            style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}
            placeholder="Value"
            value={header.value}
            onChange={(value) => updateHeader(idx, { value })}
            disabled={!activeTab}
          />
          <VariableTextInput
            className="input"
            style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}
            placeholder="Description"
            value={header.description || ''}
            onChange={(value) => updateHeader(idx, { description: value })}
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
            onClick={() => { if (activeTab) removeHeader(idx); }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--status-delete-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
            title="Remove Header"
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
          gap: 8,
          padding: '10px 0',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          border: '1px dashed var(--border-highlight)',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          cursor: activeTab ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-fast)',
          opacity: activeTab ? 1 : 0.4,
        }}
        onClick={() => { if (activeTab) addHeader(); }}
        onMouseEnter={(e) => {
          if (!activeTab) return;
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'var(--text-tertiary)';
          e.currentTarget.style.background = 'var(--bg-glass)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-tertiary)';
          e.currentTarget.style.borderColor = 'var(--border-highlight)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Plus size={15} /> Add Header
      </button>
    </div>
  );
}
