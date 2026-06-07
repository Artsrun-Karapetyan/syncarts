import { useState } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

type Tab = 'overview' | 'authorization' | 'scripts' | 'variables' | 'runs';

export function CollectionFolderTabs() {
  const { activeTab } = useWorkspace();
  const [activeView, setActiveView] = useState<Tab>('overview');

  if (!activeTab || (activeTab.type !== 'collection' && activeTab.type !== 'folder')) {
    return null;
  }

  const isCollection = activeTab.type === 'collection';

  const TABS: { id: Tab; label: string; hide?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'authorization', label: 'Authorization' },
    { id: 'scripts', label: 'Scripts' },
    { id: 'variables', label: 'Variables', hide: !isCollection },
    { id: 'runs', label: 'Runs', hide: !isCollection },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 16px', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          {isCollection ? 'Collection' : 'Folder'}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {activeTab.name}
        </h1>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid var(--border-color)',
          paddingLeft: 24,
          flexShrink: 0,
        }}
      >
        {TABS.filter(t => !t.hide).map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeView === tab.id ? 'active' : ''}`}
            onClick={() => setActiveView(tab.id)}
            style={{ padding: '12px 16px', fontSize: 13 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 32 }}>
        {activeView === 'overview' && (
          <div style={{ color: 'var(--text-secondary)' }}>
            No description added yet.
          </div>
        )}
        {activeView === 'authorization' && (
          <div style={{ color: 'var(--text-secondary)' }}>
            <p>Authorization settings will go here.</p>
            <p>Coming soon...</p>
          </div>
        )}
        {activeView === 'scripts' && (
          <div style={{ color: 'var(--text-secondary)' }}>
            <p>Scripts editor will go here.</p>
            <p>Coming soon...</p>
          </div>
        )}
        {activeView === 'variables' && (
          <div style={{ color: 'var(--text-secondary)' }}>
            <p>Variables editor will go here.</p>
            <p>Coming soon...</p>
          </div>
        )}
        {activeView === 'runs' && (
          <div style={{ color: 'var(--text-secondary)' }}>
            <p>Collection Runner is not implemented yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
