import { useState } from 'react';

import { HeadersEditor } from './HeadersEditor';
import { BodyEditor } from './BodyEditor';
import { useWorkspace } from '../../contexts/WorkspaceContext';

import './RequestTabs.css';

type Tab = 'headers' | 'body' | 'auth' | 'params';

const TABS: { id: Tab; label: string; disabled?: boolean }[] = [
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'params', label: 'Params', disabled: true },
  { id: 'auth', label: 'Auth', disabled: true },
];

export function RequestTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('headers');
  const { activeTab: activeRequest } = useWorkspace();

  const filledHeadersCount = activeRequest?.headers.filter(h => h.key.trim()).length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid var(--border-color)',
          paddingLeft: 4,
          flexShrink: 0,
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.disabled}
            style={{ opacity: tab.disabled ? 0.35 : 1 }}
          >
            {tab.label}
            {tab.id === 'headers' && filledHeadersCount > 0 && (
              <span className="tab-badge">{filledHeadersCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
        {activeTab === 'headers' && <HeadersEditor />}
        {activeTab === 'body' && <BodyEditor />}
        {activeTab === 'params' && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 24, textAlign: 'center' }}>
            Query params — coming soon
          </div>
        )}
        {activeTab === 'auth' && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 24, textAlign: 'center' }}>
            Authentication — coming soon
          </div>
        )}
      </div>
    </div>
  );
}
