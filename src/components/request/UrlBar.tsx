import { useWorkspace } from '../../contexts/WorkspaceContext';

import './UrlBar.css';

export function UrlBar() {
  const { activeTab, updateActiveTab } = useWorkspace();

  return (
    <input 
      className="url-input font-mono" 
      placeholder="https://api.example.com/v1/users" 
      value={activeTab?.url || ''}
      onChange={(e) => updateActiveTab({ url: e.target.value })}
      disabled={!activeTab}
      spellCheck={false}
    />
  );
}
