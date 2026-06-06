import { Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function HeadersEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const headers = activeTab?.headers || [];

  const updateHeader = (index: number, key: string, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = { key, value };
    updateActiveTab({ headers: newHeaders });
  };

  const addHeader = () => {
    updateActiveTab({ headers: [...headers, { key: '', value: '' }] });
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    if (newHeaders.length === 0) newHeaders.push({ key: '', value: '' });
    updateActiveTab({ headers: newHeaders });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1">Headers</div>
      
      <div className="flex flex-col gap-2">
        {headers.map((header, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input 
              className="input flex-1 font-mono text-sm" 
              placeholder="Key (e.g. Authorization)" 
              value={header.key}
              onChange={(e) => updateHeader(idx, e.target.value, header.value)}
              disabled={!activeTab}
            />
            <input 
              className="input flex-1 font-mono text-sm" 
              placeholder="Value" 
              value={header.value}
              onChange={(e) => updateHeader(idx, header.key, e.target.value)}
              disabled={!activeTab}
            />
            <div 
              className={`p-2 text-status-delete rounded transition-fast flex items-center justify-center ${activeTab ? 'hover:bg-tertiary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
              onClick={() => { if(activeTab) removeHeader(idx); }}
              title="Remove Header"
            >
              <Trash2 size={16} />
            </div>
          </div>
        ))}
        
        <div 
          className={`p-2 text-sm w-full mt-2 rounded border border-dashed border-color transition-fast flex items-center justify-center gap-2 font-semibold ${activeTab ? 'text-secondary hover:text-primary hover:border-primary hover:bg-tertiary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          onClick={() => { if(activeTab) addHeader(); }}
        >
          <Plus size={16} /> Add Header
        </div>
      </div>
    </div>
  );
}
