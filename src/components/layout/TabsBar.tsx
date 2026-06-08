import { useEffect, useRef } from 'react';
import { X, Plus, Circle } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function TabsBar() {
  const { tabs, activeTabId, setActiveTabId, closeTab, addTab } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current || !activeTabId) return;

    const activeTabEl = scrollRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTabId}"]`);
    activeTabEl?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeTabId]);

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
            minHeight: 36,
          }}
          onWheel={(event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.currentTarget.scrollLeft += event.deltaY;
          }}
        >
          <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 'max-content' }}>
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
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
                    minWidth: 140,
                    maxWidth: 240,
                    padding: '0 12px',
                    fontSize: 13,
                    borderTop: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    background: isActive ? 'var(--bg-primary)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                  onClick={() => setActiveTabId(tab.id)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }
                  }}
                >
                  <Circle
                    size={7}
                    fill={`var(--status-${tab.method.toLowerCase()})`}
                    color={`var(--status-${tab.method.toLowerCase()})`}
                  />
                  <span style={{ fontWeight: 600, fontSize: 11, color: `var(--status-${tab.method.toLowerCase()})`, flexShrink: 0 }}>
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
                  <div
                    style={{
                      padding: 4,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isActive ? 0.5 : 0,
                      transition: 'all var(--transition-fast)',
                      flexShrink: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'var(--status-delete-bg)';
                      e.currentTarget.style.color = 'var(--status-delete)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = isActive ? '0.5' : '0';
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'inherit';
                    }}
                  >
                    <X size={13} />
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
