import { Plus, Trash2 } from 'lucide-react';
import { useWorkspace, EnvironmentVariable } from '../../contexts/WorkspaceContext';

export function CollectionVariablesEditor() {
  const { activeTab, collections, updateCollection, updateFolder } = useWorkspace();

  if (!activeTab || (activeTab.type !== 'collection' && activeTab.type !== 'folder')) return null;

  const activeCollection = collections.find(collection => collection.id === activeTab.collectionId);
  
  let targetItem: any = activeCollection;
  if (activeTab.type === 'folder' && activeCollection && activeTab.folderId) {
    const findFolder = (items: any[], id: string): any => {
      for (const item of items) {
        if (item.type === 'folder' && item.id === id) return item;
        if (item.type === 'folder' && item.items) {
          const found = findFolder(item.items, id);
          if (found) return found;
        }
      }
      return null;
    };
    targetItem = findFolder(activeCollection.items, activeTab.folderId) || activeCollection;
  }

  const variables = targetItem?.variables || activeTab.variables || [];
  const updateVariables = (nextVariables: EnvironmentVariable[]) => {
    if (!activeTab.collectionId) return;
    if (activeTab.type === 'folder' && activeTab.folderId) {
      updateFolder(activeTab.collectionId, activeTab.folderId, { variables: nextVariables });
    } else {
      updateCollection(activeTab.collectionId, { variables: nextVariables });
    }
  };

  const updateVariable = (id: string, updates: Partial<EnvironmentVariable>) => {
    updateVariables(variables.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const removeVariable = (id: string) => {
    updateVariables(variables.filter(v => v.id !== id));
  };

  const addVariable = () => {
    updateVariables([...variables, { id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          These variables are specific to this {activeTab.type === 'folder' ? 'folder' : 'collection'} and its nested items.
        </div>
      </div>
      
      <div style={{ padding: '24px 32px', overflow: 'auto', flex: 1 }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'auto 1fr 1fr 32px', 
          gap: 12, 
          alignItems: 'center',
          marginBottom: 8,
          padding: '0 8px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ width: 16 }}></div>
          <div>Variable</div>
          <div>Initial Value</div>
          <div></div>
        </div>

        {variables.map((v) => (
          <div 
            key={v.id} 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr 1fr 32px', 
              gap: 12, 
              alignItems: 'center',
              marginBottom: 8
            }}
          >
            <input
              type="checkbox"
              checked={v.enabled}
              onChange={(e) => updateVariable(v.id, { enabled: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer', margin: 0 }}
            />
            <input
              className="input"
              value={v.key}
              onChange={(e) => updateVariable(v.id, { key: e.target.value })}
              placeholder="New Variable"
              style={{ opacity: v.enabled ? 1 : 0.5 }}
            />
            <input
              className="input"
              value={v.value}
              onChange={(e) => updateVariable(v.id, { value: e.target.value })}
              placeholder="Value"
              style={{ opacity: v.enabled ? 1 : 0.5 }}
            />
            <button
              className="btn"
              onClick={() => removeVariable(v.id)}
              style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--status-delete)'; e.currentTarget.style.background = 'var(--status-delete-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        
        <button
          className="btn"
          onClick={addVariable}
          style={{ marginTop: 8, fontSize: 13 }}
        >
          <Plus size={14} style={{ marginRight: 6 }} /> Add Variable
        </button>
      </div>
    </div>
  );
}
