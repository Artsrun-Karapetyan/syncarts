import { useRef, useState, useEffect } from 'react';
import { Send, Loader2, ChevronDown } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { MethodSelector } from '../request/MethodSelector';
import { UrlBar } from '../request/UrlBar';
import { RequestTabs } from '../request/RequestTabs';
import { ResponseViewer } from '../response/ResponseViewer';
import { TabsBar } from './TabsBar';
import { SaveDialog } from '../request/SaveDialog';
import { CollectionFolderTabs } from './CollectionFolderTabs';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function Workspace() {
  const { sendRequest, isMutating, activeTab, collections, updateActiveTab, saveActiveRequestInPlace, addTab } = useWorkspace();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleDirectSave = () => {
    if (!saveActiveRequestInPlace()) {
      setShowSaveDialog(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        
        // If it's a request (not a folder/collection view)
        if (!activeTab || activeTab.type === 'request') {
          if (e.shiftKey) {
            setShowSaveDialog(true);
          } else {
            handleDirectSave();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, collections]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tabs */}
      <TabsBar />

      {!activeTab ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No request open</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Create a request or open one from a collection.</div>
            <button className="btn" style={{ marginTop: 4 }} onClick={() => addTab()}>
              New Request
            </button>
          </div>
        </div>
      ) : (activeTab.type === 'request' || activeTab.type === 'example' || !activeTab.type) ? (
        <>
          {/* Header & URL Bar */}
          <div style={{ padding: '16px 16px 0 16px', flexShrink: 0, position: 'relative', zIndex: 50 }}>
            {/* Top Row: Name and Save */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingLeft: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                  value={activeTab?.name || ''}
                  placeholder="Untitled Request"
                  onChange={(e) => updateActiveTab({ name: e.target.value })}
                />
              </div>

              {activeTab?.type !== 'example' && (
                <div style={{ display: 'flex', borderRadius: 6, background: 'var(--bg-tertiary)', overflow: 'hidden', height: 32, border: '1px solid var(--border-color)' }}>
                  <button
                    ref={saveBtnRef}
                    className="btn"
                    style={{
                      fontSize: 13,
                      padding: '0 16px',
                      height: '100%',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 0,
                      background: 'transparent'
                    }}
                    onClick={() => {
                      handleDirectSave();
                    }}
                  >
                    Save
                  </button>
                  <div style={{ width: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                  <button
                    className="btn"
                    style={{
                      padding: '0 8px',
                      height: '100%',
                      border: 'none',
                      borderRadius: 0,
                      background: 'transparent'
                    }}
                    onClick={() => setShowSaveDialog((current) => !current)}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Row: URL Bar */}
            <div
              className="glass-panel"
              style={{
                padding: 6,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                borderRadius: 9999,
              }}
            >
              <MethodSelector />
              <UrlBar />
              <button
                className={activeTab?.type === 'example' ? "btn" : "btn-success"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  padding: '0 24px',
                  borderRadius: 9999,
                  height: 38,
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  border: 'none',
                  cursor: isMutating && activeTab?.type !== 'example' ? 'not-allowed' : 'pointer',
                  opacity: isMutating && activeTab?.type !== 'example' ? 0.7 : 1,
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => {
                  if (activeTab?.type === 'example') {
                    // Just visually save for now or trigger a toast
                  } else {
                    sendRequest();
                  }
                }}
                disabled={isMutating && activeTab?.type !== 'example'}
              >
                {activeTab?.type === 'example' ? (
                  'Save Example'
                ) : isMutating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    SEND
                  </>
                )}
              </button>
            </div>

            {showSaveDialog && <SaveDialog onClose={() => setShowSaveDialog(false)} anchorRef={saveBtnRef} />}
          </div>

          {/* Main Content — Request + Response */}
      <div style={{ flex: 1, display: 'flex', gap: 0, padding: '0 16px 16px', minHeight: 0 }}>
        <PanelGroup direction="horizontal">
          {/* Request panel with tabs */}
          <Panel defaultSize={50} minSize={20} style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', paddingRight: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 4 }}>Request</div>
            <div
              className="glass-panel"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
            >
              <RequestTabs />
            </div>
          </Panel>

          <PanelResizeHandle className="custom-resize-handle" />

          {/* Response panel */}
          <Panel defaultSize={50} minSize={20} style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', paddingLeft: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 4 }}>
              {activeTab?.type === 'example' ? 'Example Response' : 'Response'}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <ResponseViewer />
            </div>
          </Panel>
        </PanelGroup>
      </div>
      </>
      ) : (
        <CollectionFolderTabs />
      )}
    </div>
  );
}
