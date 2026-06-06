import { X, Plus } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function TabsBar() {
  const { tabs, activeTabId, setActiveTabId, closeTab, addTab } = useWorkspace();

  const getMethodColor = (m: string) => `text-status-${m.toLowerCase()}`;

  return (
    <div 
      className="flex items-stretch shrink-0 overflow-x-auto overflow-y-hidden bg-secondary border-b border-color"
      style={{ minHeight: '42px' }}
    >
      {tabs.map((tab) => (
        <div 
          key={tab.id}
          className={`group flex items-center gap-3 cursor-pointer transition-fast whitespace-nowrap border-r border-color ${
            activeTabId === tab.id 
              ? 'text-primary bg-primary' 
              : 'text-secondary hover:text-primary hover:bg-tertiary'
          }`}
          style={{ 
            minWidth: '200px', 
            maxWidth: '280px',
            padding: '0 20px',
            fontSize: '13px',
            borderTop: activeTabId === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
          }}
          onClick={() => setActiveTabId(tab.id)}
        >
          <span className={`font-bold shrink-0 ${getMethodColor(tab.method)}`} style={{ fontSize: '11px' }}>
            {tab.method}
          </span>
          <span className="truncate flex-1 font-medium">
            {tab.name || 'Untitled Request'}
          </span>
          <div 
            className={`p-1 rounded hover:bg-tertiary transition-fast shrink-0 flex items-center justify-center ${
              activeTabId === tab.id ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70 hover:opacity-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            <X size={14} />
          </div>
        </div>
      ))}
      <div 
        className="flex items-center justify-center px-3 text-secondary hover:text-primary hover:bg-tertiary transition-fast cursor-pointer"
        onClick={() => addTab()}
        title="New Tab"
      >
        <Plus size={16} />
      </div>
    </div>
  );
}
