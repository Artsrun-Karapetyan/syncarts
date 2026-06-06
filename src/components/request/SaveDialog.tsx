import { useState } from 'react';
import { useWorkspace, SavedRequest } from '../../contexts/WorkspaceContext';

interface SaveDialogProps {
  onClose: () => void;
}

export function SaveDialog({ onClose }: SaveDialogProps) {
  const { activeTab, collections, saveRequest, updateActiveTab } = useWorkspace();
  const [requestName, setRequestName] = useState(activeTab?.name === 'Untitled Request' ? '' : activeTab?.name || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || '');

  if (!activeTab) return null;

  const handleSave = () => {
    if (!selectedCollectionId) return;
    
    const finalName = requestName.trim() || 'Untitled Request';
    
    const req: SavedRequest = {
      type: 'request',
      id: crypto.randomUUID(),
      name: finalName,
      method: activeTab.method,
      url: activeTab.url,
      headers: activeTab.headers,
      body: activeTab.body,
    };
    
    saveRequest(selectedCollectionId, null, req);
    updateActiveTab({ name: finalName });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-color rounded-lg shadow-lg w-full max-w-md flex flex-col p-6">
        <h2 className="text-lg font-bold text-primary mb-4">Save Request</h2>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-tertiary uppercase tracking-wider block mb-2">Request Name</label>
            <input 
              autoFocus
              className="input w-full"
              placeholder="e.g. Get All Users"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-tertiary uppercase tracking-wider block mb-2">Save to Collection</label>
            {collections.length === 0 ? (
              <div className="text-sm text-status-delete">Please create a collection in the sidebar first.</div>
            ) : (
              <select 
                className="input w-full bg-bg-primary"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
              >
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 justify-end mt-8">
          <button className="btn bg-transparent border-transparent" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary px-6" 
            onClick={handleSave}
            disabled={!selectedCollectionId}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
