import { useState, useMemo } from 'react';
import { Clock, Zap } from 'lucide-react';
import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';

import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ResponseEmptyState } from './ResponseEmptyState';
import { ResponseLoadingState } from './ResponseLoadingState';

import './ResponseViewer.css';
import '../request/RequestTabs.css';

type ResponseTab = 'body' | 'headers';

export function ResponseViewer() {
  const { activeTab, error, isMutating } = useWorkspace();
  const response = activeTab?.response;
  const [viewTab, setViewTab] = useState<ResponseTab>('body');
  const [bodyFormat, setBodyFormat] = useState<'pretty' | 'raw'>('pretty');

  const parsedBody = useMemo(() => {
    if (!response?.body) return null;
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }, [response?.body]);

  const getStatusClass = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'redirect';
    return 'error';
  };

  const formatStatusText = (status: number, text: string) => {
    const statusStr = status.toString();
    return text.startsWith(statusStr) ? text.substring(statusStr.length).trim() : text;
  };

  const responseHeaderEntries = response?.headers ? Object.entries(response.headers) : [];

  return (
    <div
      className="glass-panel"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
    >
      {/* Header with status badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            type="button"
            className={`tab-button ${viewTab === 'body' ? 'active' : ''}`}
            onClick={() => setViewTab('body')}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Body
          </button>
          <button
            type="button"
            className={`tab-button ${viewTab === 'headers' ? 'active' : ''}`}
            onClick={() => setViewTab('headers')}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Headers
            {responseHeaderEntries.length > 0 && (
              <span
                style={{
                  marginLeft: 5,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 8,
                  padding: '1px 6px',
                }}
              >
                {responseHeaderEntries.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {response ? (
            <>
              <span className={`status-pill ${getStatusClass(response.status)}`}>
                <Zap size={11} />
                {response.status} {formatStatusText(response.status, response.status_text)}
              </span>
              <span
                className="font-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                <Clock size={11} style={{ opacity: 0.6 }} />
                {response.time_ms} ms
              </span>
            </>
          ) : (
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              — no response
            </span>
          )}
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {isMutating && <ResponseLoadingState />}

        {!isMutating && error && (
          <div style={{ padding: 24 }}>
            <pre className="font-mono" style={{ fontSize: 13, color: 'var(--status-delete)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {String(error)}
            </pre>
          </div>
        )}

        {!isMutating && !error && response && viewTab === 'body' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {parsedBody && (
              <div style={{ 
                padding: '8px 16px', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
                  <button 
                    onClick={() => setBodyFormat('pretty')} 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: '4px', 
                      background: bodyFormat === 'pretty' ? 'var(--bg-primary)' : 'transparent', 
                      color: bodyFormat === 'pretty' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontSize: 12, 
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Pretty
                  </button>
                  <button 
                    onClick={() => setBodyFormat('raw')} 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: '4px', 
                      background: bodyFormat === 'raw' ? 'var(--bg-primary)' : 'transparent', 
                      color: bodyFormat === 'raw' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontSize: 12, 
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Raw
                  </button>
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {parsedBody && bodyFormat === 'pretty' ? (
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                  <JsonView 
                    value={parsedBody} 
                    style={{
                      ...darkTheme,
                      '--w-rjv-background-color': 'transparent',
                      '--w-rjv-color': 'var(--text-primary)',
                      '--w-rjv-key-string': 'var(--accent-primary)',
                      '--w-rjv-key-number': 'var(--accent-primary)',
                      '--w-rjv-colon-color': 'var(--text-tertiary)',
                      '--w-rjv-type-string-color': 'var(--status-get)',
                      '--w-rjv-type-int-color': 'var(--status-put)',
                      '--w-rjv-type-float-color': 'var(--status-put)',
                      '--w-rjv-type-boolean-color': 'var(--status-delete)',
                      '--w-rjv-type-null-color': 'var(--text-tertiary)',
                      '--w-rjv-line-color': 'var(--border-color)',
                      '--w-rjv-arrow-color': 'var(--text-tertiary)',
                      '--w-rjv-info-color': 'var(--text-tertiary)',
                      '--w-rjv-edit-color': 'var(--accent-primary)',
                      '--w-rjv-update-color': 'var(--accent-primary)',
                      '--w-rjv-copied-color': 'var(--accent-primary)',
                    } as React.CSSProperties}
                    displayDataTypes={false} 
                    displayObjectSize={false}
                    collapsed={1}
                  />
                </div>
              ) : (
                <pre
                  className="font-mono"
                  style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-primary)' }}
                >
                  {response.body}
                </pre>
              )}
            </div>
          </div>
        )}

        {!isMutating && !error && response && viewTab === 'headers' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {responseHeaderEntries.map(([key, value]) => (
              <div key={key} className="response-header-row">
                <span className="font-mono response-header-key">{key}</span>
                <span className="font-mono response-header-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {!isMutating && !error && !response && <ResponseEmptyState />}
      </div>
    </div>
  );
}
