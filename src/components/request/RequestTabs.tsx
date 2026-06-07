import { useState } from 'react';

import { HeadersEditor } from './HeadersEditor';
import { BodyEditor } from './BodyEditor';
import { ParamsEditor } from './ParamsEditor';
import { AuthEditor } from './AuthEditor';
import { ScriptsEditor } from './ScriptsEditor';
import { DocsEditor } from './DocsEditor';
import { useWorkspace } from '../../contexts/WorkspaceContext';

import './RequestTabs.css';

type Tab = 'headers' | 'body' | 'auth' | 'params' | 'scripts' | 'docs';

const TABS: { id: Tab; label: string; disabled?: boolean }[] = [
  { id: 'params', label: 'Params' },
  { id: 'auth', label: 'Auth' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'docs', label: 'Docs' },
];

export function RequestTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('headers');
  const { activeTab: activeRequest } = useWorkspace();

  const filledHeadersCount = activeRequest?.headers.filter(h => h.key.trim()).length ?? 0;

  // Calculate params count
  const getParamsCount = () => {
    if (!activeRequest?.url) return 0;
    try {
      const [, query] = activeRequest.url.split('?');
      if (!query) return 0;
      return query.split('&').filter(p => p.trim() && p !== '=').length;
    } catch {
      return 0;
    }
  };
  const paramsCount = getParamsCount();

  // Calculate auth state
  const hasAuth = activeRequest?.headers.some(h => h.key.toLowerCase() === 'authorization' && h.value.startsWith('Bearer ')) ?? false;

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
            {tab.id === 'params' && paramsCount > 0 && (
              <span className="tab-badge">{paramsCount}</span>
            )}
            {tab.id === 'auth' && hasAuth && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', marginLeft: 6 }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: (activeTab === 'scripts' || activeTab === 'docs') ? 0 : 16 }}>
        {activeTab === 'headers' && <HeadersEditor />}
        {activeTab === 'body' && <BodyEditor />}
        {activeTab === 'params' && <ParamsEditor />}
        {activeTab === 'auth' && <AuthEditor />}
        {activeTab === 'scripts' && <ScriptsEditor />}
        {activeTab === 'docs' && <DocsEditor />}
      </div>
    </div>
  );
}
