import { useState, useMemo } from 'react';
import { Clock, Zap } from 'lucide-react';
import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import CodeEditor from '@uiw/react-textarea-code-editor';

import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ResponseEmptyState } from './ResponseEmptyState';
import { ResponseLoadingState } from './ResponseLoadingState';

import './ResponseViewer.css';
import '../request/RequestTabs.css';

type ResponseTab = 'body' | 'headers' | 'test-results';

export function ResponseViewer() {
  const { activeTab, addTab, error, isMutating } = useWorkspace();
  const response = activeTab?.response;
  const [viewTab, setViewTab] = useState<ResponseTab>('body');
  const [bodyFormat, setBodyFormat] = useState<'pretty' | 'raw' | 'preview'>('pretty');

  const contentType = (response?.headers?.['content-type'] || response?.headers?.['Content-Type'] || '').toLowerCase();
  const isImage = contentType.startsWith('image/');
  const isPdf = contentType.startsWith('application/pdf');
  const isBinary = isImage || isPdf;

  const parsedBody = useMemo(() => {
    if (!response?.body || isBinary) return null;
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }, [response?.body, isBinary]);

  // Set default format to preview for HTML
  useMemo(() => {
    if (response) {
      if (contentType.includes('html')) {
        setBodyFormat('preview');
      } else {
        setBodyFormat('pretty');
      }
    }
  }, [response]);

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

  const handleJsonClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // @uiw/react-json-view renders strings inside spans. 
    // We check if the clicked text looks like a URL.
    if (target.tagName === 'SPAN' && (target.innerText.includes('http://') || target.innerText.includes('https://'))) {
      let url = target.innerText.trim();
      if (url.startsWith('"')) url = url.slice(1);
      if (url.endsWith('"')) url = url.slice(0, -1);
      if (url.endsWith('",')) url = url.slice(0, -2);
      
      // Basic URL validation
      if (url.startsWith('http')) {
        if (e.metaKey || e.ctrlKey) {
          import('@tauri-apps/plugin-opener').then((opener) => opener.openUrl(url));
        } else {
          addTab({ 
            id: crypto.randomUUID(), 
            name: url.split('/').pop() || 'New Request', 
            method: 'GET', 
            url, 
            bodyType: 'none',
            headers: [],
            params: [],
            auth: { type: 'none' }
          });
        }
      }
    }
  };

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
          <button
            type="button"
            className={`tab-button ${viewTab === 'test-results' ? 'active' : ''}`}
            onClick={() => setViewTab('test-results')}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Test Results
            {activeTab?.testResults && activeTab.testResults.length > 0 && (
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
                {activeTab.testResults.filter(t => t.passed).length}/{activeTab.testResults.length}
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

        {!isMutating && !!error && (
          <div style={{ padding: 24 }}>
            <div style={{ color: 'var(--status-delete)', background: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 8, fontSize: 13, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {String(error)}
            </div>
          </div>
        )}

        {!isMutating && !error && response && viewTab === 'body' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {!isBinary && (
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
                  <button 
                    onClick={() => setBodyFormat('preview')} 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: '4px', 
                      background: bodyFormat === 'preview' ? 'var(--bg-primary)' : 'transparent', 
                      color: bodyFormat === 'preview' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontSize: 12, 
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Preview
                  </button>
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflow: 'auto', padding: isBinary ? 0 : 20 }} onClick={handleJsonClick}>
              {isBinary ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#fff' }}>
                  {isImage ? (
                    <img src={response.body} alt="Response Image" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <iframe src={response.body} style={{ width: '100%', height: '100%', border: 'none' }} />
                  )}
                </div>
              ) : bodyFormat === 'preview' ? (
                <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
                  <iframe srcDoc={response.body} style={{ width: '100%', height: '100%', border: 'none' }} title="Preview" sandbox="allow-scripts allow-same-origin" />
                </div>
              ) : parsedBody && bodyFormat === 'pretty' ? (
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }} className="json-view-container">
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
                    enableClipboard={false}
                    collapsed={1}
                  />
                </div>
              ) : bodyFormat === 'pretty' && response?.body ? (
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                  <CodeEditor
                    value={response.body}
                    language={
                      contentType.includes('xml') ? 'xml' :
                      contentType.includes('html') ? 'html' : 'text'
                    }
                    placeholder="Please enter code."
                    disabled
                    padding={15}
                    style={{
                      fontSize: 13,
                      backgroundColor: "transparent",
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              ) : (
                <pre
                  className="font-mono"
                  style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-primary)' }}
                >
                  {response?.body}
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

        {viewTab === 'test-results' && (
          <div style={{ padding: 16 }}>
            {(!activeTab?.testResults?.length && !activeTab?.consoleLogs?.length) && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                No test results or console logs.
              </div>
            )}
            
            {activeTab?.testResults && activeTab.testResults.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Test Results</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeTab.testResults.map((test, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      fontSize: 13
                    }}>
                      <div style={{ color: test.passed ? 'var(--status-success)' : 'var(--status-error)', marginTop: 2 }}>
                        {test.passed ? '✓' : '✗'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{test.name}</div>
                        {!test.passed && test.error && (
                          <div style={{ color: 'var(--status-error)', fontSize: 12, fontFamily: 'monospace' }}>
                            {test.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab?.consoleLogs && activeTab.consoleLogs.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Console Output</div>
                <div style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 6, 
                  padding: 12,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  {activeTab.consoleLogs.map((log, idx) => {
                    const isError = log.includes('[ERROR]') || log.includes('[SCRIPT ERROR]');
                    const isWarn = log.includes('[WARN]');
                    return (
                      <div key={idx} style={{ 
                        color: isError ? 'var(--status-error)' : isWarn ? 'var(--status-warning)' : 'inherit',
                        padding: '2px 0',
                        borderBottom: idx < activeTab.consoleLogs!.length - 1 ? '1px solid var(--border-color)' : 'none'
                      }}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!isMutating && !error && !response && <ResponseEmptyState />}
      </div>
    </div>
  );
}
