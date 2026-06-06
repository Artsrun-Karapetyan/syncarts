import { useWorkspace } from '../../contexts/WorkspaceContext';

export function BodyEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
    </div>
  );
}
