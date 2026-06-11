import { useEffect, useRef } from 'react';
import { X, Plus, Circle } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function TabsBar() {
  const { tabs, activeTabId, activeTab, setActiveTabId, closeTab, addTab, isTabDirty, resolveTabSavedRequestId } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current || !activeTabId) return;

    const activeTabEl = scrollRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTabId}"]`);
    activeTabEl?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeTabId]);

  useEffect(() => {
    const savedRequestId = resolveTabSavedRequestId(activeTab);
    if (!savedRequestId) return;
    window.dispatchEvent(new CustomEvent('highlight-sidebar', { detail: { savedRequestId } }));
  }, [activeTabId, activeTab, resolveTabSavedRequestId]);

  return (
    <div
      style={{
        flexShrink: 0,
        width: '100%',
        minWidth: 0,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            minHeight: 32,
          }}
          onWheel={(event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.currentTarget.scrollLeft += event.deltaY;
          }}
        >
          <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 'max-content' }}>
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              const isDirty = isTabDirty(tab);
              return (
                <div
                  key={tab.id}
                  data-tab-id={tab.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap',
                    borderRight: '1px solid var(--border-color)',
                    width: 140,
                    padding: '0 10px',
                    fontSize: 12,
                    borderTop: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    background: isActive ? 'var(--bg-primary)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                  onClick={() => {
                    const wasActive = activeTabId === tab.id;
                    const savedRequestId = resolveTabSavedRequestId(tab);
                    setActiveTabId(tab.id);
                    if (wasActive && savedRequestId) {
                      window.dispatchEvent(new CustomEvent('highlight-sidebar', { detail: { savedRequestId } }));
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                    const closeBtn = e.currentTarget.querySelector('.tab-close-btn') as HTMLElement;
                    if (closeBtn) closeBtn.style.opacity = '1';
                    const dirtyDot = e.currentTarget.querySelector('.tab-dirty-dot') as HTMLElement;
                    if (dirtyDot) dirtyDot.style.opacity = '0';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }
                    const closeBtn = e.currentTarget.querySelector('.tab-close-btn') as HTMLElement;
                    if (closeBtn) closeBtn.style.opacity = isActive ? '0.5' : '0';
                    const dirtyDot = e.currentTarget.querySelector('.tab-dirty-dot') as HTMLElement;
                    if (dirtyDot) dirtyDot.style.opacity = '1';
                  }}
                >
                  <Circle
                    size={7}
                    fill={`var(--status-${tab.method?.toLowerCase() || 'get'})`}
                    color={`var(--status-${tab.method?.toLowerCase() || 'get'})`}
                  />
                  <span style={{ fontWeight: 600, fontSize: 10, color: `var(--status-${tab.method?.toLowerCase() || 'get'})`, flexShrink: 0 }}>
                    {tab.method}
                  </span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontWeight: 500,
                    }}
                  >
                    {tab.name || 'Untitled Request'}
                  </span>
                  <div style={{ position: 'relative', width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDirty && (
                      <div 
                        className="tab-dirty-dot"
                        style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          background: 'var(--status-put)', // Orange dot
                          position: 'absolute',
                          transition: 'opacity 0.15s',
                        }} 
                      />
                    )}
                    <div
                      className="tab-close-btn"
                      style={{
                        padding: 4,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isActive && !isDirty ? 0.5 : 0,
                        transition: 'all var(--transition-fast)',
                        position: 'absolute',
                        background: 'transparent',
                        color: 'inherit',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--status-delete-bg)';
                        e.currentTarget.style.color = 'var(--status-delete)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'inherit';
                      }}
                    >
                      <X size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 16px',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => addTab()}
              title="New Tab"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Plus size={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
