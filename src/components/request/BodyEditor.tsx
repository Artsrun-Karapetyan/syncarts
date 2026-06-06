import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useWorkspace, BodyType, FormDataItem } from '../../contexts/WorkspaceContext';

export function BodyEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();

  const currentBodyType = activeTab?.bodyType || 'raw';
  
  const handleTypeChange = (type: BodyType) => {
    updateActiveTab({ bodyType: type });
  };

  const handleUpdateFormData = (id: string, updates: Partial<FormDataItem>) => {
    if (!activeTab) return;
    const newData = (activeTab.formData || []).map(item => item.id === id ? { ...item, ...updates } : item);
    updateActiveTab({ formData: newData });
  };

  const handleAddFormData = () => {
    if (!activeTab) return;
    const newData = [...(activeTab.formData || []), { id: crypto.randomUUID(), key: '', value: '', enabled: true, type: 'text' as const }];
    updateActiveTab({ formData: newData });
  };

  const handleDeleteFormData = (id: string) => {
    if (!activeTab) return;
    const newData = (activeTab.formData || []).filter(item => item.id !== id);
    updateActiveTab({ formData: newData });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Body Type Selector */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
        {(['none', 'form-data', 'x-www-form-urlencoded', 'raw'] as BodyType[]).map(type => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: currentBodyType === type ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <input 
              type="radio" 
              name="bodyType" 
              checked={currentBodyType === type} 
              onChange={() => handleTypeChange(type)} 
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            {type === 'none' ? 'none' : type === 'form-data' ? 'form-data' : type === 'x-www-form-urlencoded' ? 'x-www-form-urlencoded' : 'raw'}
          </label>
        ))}
      </div>

      {currentBodyType === 'none' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          This request does not have a body
        </div>
      )}

      {currentBodyType === 'raw' && (
        <textarea
          className="input font-mono"
          style={{
            flex: 1,
            minHeight: 200,
            resize: 'none',
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}
          placeholder={'{\n  "key": "value"\n}'}
          value={activeTab?.body || ''}
          onChange={(e) => updateActiveTab({ body: e.target.value })}
          disabled={!activeTab}
          spellCheck={false}
        />
      )}

      {(currentBodyType === 'form-data' || currentBodyType === 'x-www-form-urlencoded') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', fontWeight: 600, fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid var(--border-color)', marginBottom: 8 }}>
            <div style={{ width: 40, textAlign: 'center' }}></div>
            <div style={{ flex: 1 }}>Key</div>
            <div style={{ flex: 1 }}>Value</div>
            <div style={{ width: 40 }}></div>
          </div>

          {(activeTab?.formData || []).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                  onClick={() => handleUpdateFormData(item.id, { enabled: !item.enabled })}
                >
                  {item.enabled ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className="input"
                  style={{ width: '100%', fontSize: 13, background: 'transparent' }}
                  placeholder="Key"
                  value={item.key}
                  onChange={(e) => handleUpdateFormData(item.id, { key: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className="input"
                  style={{ width: '100%', fontSize: 13, background: 'transparent' }}
                  placeholder="Value"
                  value={item.value}
                  onChange={(e) => handleUpdateFormData(item.id, { value: e.target.value })}
                />
              </div>
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                  onClick={() => handleDeleteFormData(item.id)}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-delete)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <button
            className="btn"
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
            onClick={handleAddFormData}
          >
            <Plus size={14} />
            Add Field
          </button>
        </div>
      )}
    </div>
  );
}
