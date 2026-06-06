import { Plus, Trash2 } from 'lucide-react';

export function HeadersEditor() {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-secondary border-b border-color pb-2">Headers</div>
      
      <div className="flex gap-2 items-center">
        <input className="input flex-1 font-mono text-sm" placeholder="Key (e.g. Authorization)" />
        <input className="input flex-1 font-mono text-sm" placeholder="Value (e.g. Bearer token...)" />
        <button className="btn p-2 text-status-delete hover:bg-status-delete hover:text-white border-transparent">
          <Trash2 size={16} />
        </button>
      </div>

      <button className="btn self-start text-xs mt-2">
        <Plus size={14} /> Add Header
      </button>
    </div>
  );
}
