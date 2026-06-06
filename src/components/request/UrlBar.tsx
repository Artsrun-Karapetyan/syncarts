import { useWorkspace } from '../../contexts/WorkspaceContext';
import { parseCurlCommand } from '../../utils/curlParser';

import './UrlBar.css';

export function UrlBar() {
  const { activeTab, updateActiveTab, sendRequest } = useWorkspace();

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.trim().toLowerCase().startsWith('curl ')) {
      const parsed = parseCurlCommand(text);
      if (parsed) {
        e.preventDefault(); // Prevent pasting just the curl string into the URL
        updateActiveTab(parsed);
      }
    }
  };

  return (
    <input 
      className="url-input font-mono" 
      placeholder="https://api.example.com/v1/users (or paste cURL)" 
      value={activeTab?.url || ''}
      onChange={(e) => updateActiveTab({ url: e.target.value })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && activeTab?.url) {
          sendRequest();
        }
      }}
      onPaste={handlePaste}
      disabled={!activeTab}
      spellCheck={false}
    />
  );
}
