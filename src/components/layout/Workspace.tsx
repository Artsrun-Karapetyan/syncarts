import { MethodSelector } from '../request/MethodSelector';
import { UrlBar } from '../request/UrlBar';
import { HeadersEditor } from '../request/HeadersEditor';
import { BodyEditor } from '../request/BodyEditor';
import { ResponseViewer } from '../response/ResponseViewer';
import { RequestProvider, useRequest } from '../../contexts/RequestContext';

export function Workspace() {
  const { sendRequest, isMutating } = useRequest();

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 h-full overflow-hidden">
      {/* Top Request Bar */}
      <div className="glass-panel p-2 flex gap-2 shrink-0 items-center rounded-full relative z-10">
        <MethodSelector />
        <UrlBar />
        <button 
          className="btn btn-primary px-6 rounded-full h-10 text-sm font-bold uppercase tracking-wider"
          onClick={sendRequest}
          disabled={isMutating}
        >
          {isMutating ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Configuration Area */}
        <div className="glass-panel p-6 flex-1 flex flex-col overflow-auto rounded-lg">
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
