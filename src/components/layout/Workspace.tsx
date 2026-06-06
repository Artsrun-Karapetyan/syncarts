import { MethodSelector } from '../request/MethodSelector';
import { UrlBar } from '../request/UrlBar';
import { HeadersEditor } from '../request/HeadersEditor';
import { BodyEditor } from '../request/BodyEditor';
import { ResponseViewer } from '../response/ResponseViewer';

export function Workspace() {
  return (
    <div className="flex-1 p-4 flex flex-col gap-4 h-full overflow-hidden">
      {/* Top Request Bar */}
      <div className="glass-panel p-4 flex gap-2 shrink-0">
        <MethodSelector />
        <UrlBar />
        <button className="btn btn-primary px-6">Send</button>
      </div>
      
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Configuration Area */}
        <div className="glass-panel p-4 flex-1 flex flex-col overflow-auto">
          <HeadersEditor />
          <BodyEditor />
        </div>
        
        {/* Response Area */}
        <ResponseViewer />
      </div>
    </div>
  );
}
