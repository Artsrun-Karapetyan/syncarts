import { MethodSelector } from '../request/MethodSelector';
import { UrlBar } from '../request/UrlBar';
import { HeadersEditor } from '../request/HeadersEditor';
import { BodyEditor } from '../request/BodyEditor';
import { ResponseViewer } from '../response/ResponseViewer';
import { TabsBar } from './TabsBar';
import { SaveDialog } from '../request/SaveDialog';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useState } from 'react';

export function Workspace() {
  const { sendRequest, isMutating } = useWorkspace();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <TabsBar />

      {/* URL Bar */}
      <div className="p-4 shrink-0">
        <div className="glass-panel p-2 flex gap-2 items-center rounded-full">
          <MethodSelector />
          <UrlBar />
          <button 
            className="btn text-sm px-6 rounded-full h-10 border border-color hover:bg-tertiary font-bold transition-fast"
            onClick={() => setShowSaveDialog(true)}
          >
            Save
          </button>
          <button 
            className="btn btn-primary px-6 rounded-full h-10 text-sm font-bold uppercase tracking-wider transition-fast"
            onClick={sendRequest}
            disabled={isMutating}
          >
            {isMutating ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {showSaveDialog && <SaveDialog onClose={() => setShowSaveDialog(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
        {/* Configuration Area */}
        <div className="glass-panel p-4 flex-1 flex flex-col overflow-auto rounded-lg">
          <HeadersEditor />
          <BodyEditor />
        </div>

        {/* Response Area */}
        <div className="flex-1 flex flex-col">
          <ResponseViewer />
        </div>
      </div>
    </div>
  );
}
