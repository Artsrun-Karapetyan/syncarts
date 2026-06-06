import { useWorkspace } from '../../contexts/WorkspaceContext';

import './UrlBar.css';

export function UrlBar() {
  const { activeTab, updateActiveTab, sendRequest } = useWorkspace();

  return (
    <input 
      className="url-input font-mono" 
      placeholder="https://api.example.com/v1/users" 
      value={activeTab?.url || ''}
      onChange={(e) => updateActiveTab({ url: e.target.value })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && activeTab?.url) {
          sendRequest();
        }
      }}
      disabled={!activeTab}
      spellCheck={false}
    />
  );
}
