import { useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

import { MethodSelector } from '../request/MethodSelector';
import { UrlBar } from '../request/UrlBar';
import { RequestTabs } from '../request/RequestTabs';
import { ResponseViewer } from '../response/ResponseViewer';
import { TabsBar } from './TabsBar';
import { SaveDialog } from '../request/SaveDialog';
import { CollectionFolderTabs } from './CollectionFolderTabs';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function Workspace() {
  const { sendRequest, isMutating, activeTab } = useWorkspace();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tabs */}
      <TabsBar />

      {(!activeTab || activeTab.type === 'request' || activeTab.type === 'example' || !activeTab.type) ? (
        <>
          {/* URL Bar */}
          <div style={{ padding: 16, flexShrink: 0, position: 'relative', zIndex: 50 }}>
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
          {activeTab?.type !== 'example' && (
            <button
              ref={saveBtnRef}
              className="btn"
              style={{
                fontSize: 13,
                padding: '0 20px',
                borderRadius: 9999,
                height: 38,
                fontWeight: 600,
              }}
              onClick={() => setShowSaveDialog((current) => !current)}
            >
              Save
            </button>
          )}
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
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: '0 16px 16px', minHeight: 0 }}>
        {/* Request panel with tabs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 4 }}>Request</div>
          <div
            className="glass-panel"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
          >
            <RequestTabs />
          </div>
        </div>

        {/* Response panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 4 }}>
            {activeTab?.type === 'example' ? 'Example Response' : 'Response'}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ResponseViewer />
          </div>
        </div>
      </div>
      </>
      ) : (
        <CollectionFolderTabs />
      )}
    </div>
  );
}
