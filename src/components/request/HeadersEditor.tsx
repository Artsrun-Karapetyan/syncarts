import { Plus, Trash2 } from 'lucide-react';
import { useRequest } from '../../contexts/RequestContext';

export function HeadersEditor() {
  const { headers, setHeaders } = useRequest();

  const updateHeader = (index: number, key: string, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = { key, value };
    setHeaders(newHeaders);
  };

  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-secondary border-b border-color pb-2">Headers</div>
      
      {headers.map((header, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input 
            className="input flex-1 font-mono text-sm" 
            placeholder="Key (e.g. Authorization)"
            value={header.key}
            onChange={(e) => updateHeader(index, e.target.value, header.value)}
          />
          <input 
            className="input flex-1 font-mono text-sm" 
            placeholder="Value (e.g. Bearer token...)" 
            value={header.value}
            onChange={(e) => updateHeader(index, header.key, e.target.value)}
          />
          <button 
            className="btn p-2 text-status-delete hover:bg-status-delete hover:text-white border-transparent"
            onClick={() => removeHeader(index)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button className="btn self-start text-xs mt-2" onClick={addHeader}>
        <Plus size={14} /> Add Header
      </button>
    </div>
  );
}
