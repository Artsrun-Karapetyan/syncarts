import { useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

import { MethodSelector } from '../request/MethodSelector';
import { UrlBar } from '../request/UrlBar';
import { RequestTabs } from '../request/RequestTabs';
import { ResponseViewer } from '../response/ResponseViewer';
import { TabsBar } from './TabsBar';
import { SaveDialog } from '../request/SaveDialog';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function Workspace() {
  const { sendRequest, isMutating } = useWorkspace();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tabs */}
      <TabsBar />

      {/* URL Bar */}
      <div style={{ padding: 16, flexShrink: 0, position: 'relative' }}>
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
          <button
            className="btn-success"
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
              cursor: isMutating ? 'not-allowed' : 'pointer',
              opacity: isMutating ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
            }}
            onClick={sendRequest}
            disabled={isMutating}
            onMouseEnter={(e) => {
              if (!isMutating) {
                e.currentTarget.style.boxShadow = 'var(--shadow-success-glow)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isMutating ? (
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
        <div
          className="glass-panel"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
        >
          <RequestTabs />
        </div>

        {/* Response panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ResponseViewer />
        </div>
      </div>
    </div>
  );
}
