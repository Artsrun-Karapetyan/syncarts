import { useRequest } from '../../contexts/RequestContext';

export function Sidebar() {
  const { setMethod, setUrl } = useRequest();

  const loadHistory = (method: string, url: string) => {
    setMethod(method);
    setUrl(url);
  };

  return (
    <div className="w-64 border-r border-color h-full bg-secondary p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-xl text-primary tracking-tight">Syncarts</h1>
        <div className="text-sm text-tertiary mt-1">API Client</div>
      </div>
      
      <div className="flex flex-col gap-2 flex-1 overflow-auto">
        <div className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">History</div>
        <div 
          className="flex items-center text-sm text-secondary p-3 hover:bg-tertiary hover:text-primary rounded-md cursor-pointer transition-smooth"
          onClick={() => loadHistory('GET', 'https://jsonplaceholder.typicode.com/users')}
        >
          <span className="text-status-get font-bold w-12 shrink-0">GET</span> 
          <span className="truncate">/users</span>
        </div>
        <div 
          className="flex items-center text-sm text-secondary p-3 hover:bg-tertiary hover:text-primary rounded-md cursor-pointer transition-smooth"
          onClick={() => loadHistory('POST', 'https://jsonplaceholder.typicode.com/posts')}
        >
          <span className="text-status-post font-bold w-12 shrink-0">POST</span> 
          <span className="truncate">/posts</span>
        </div>
        <div 
          className="flex items-center text-sm text-secondary p-3 hover:bg-tertiary hover:text-primary rounded-md cursor-pointer transition-smooth"
          onClick={() => loadHistory('DELETE', 'https://jsonplaceholder.typicode.com/posts/1')}
        >
          <span className="text-status-delete font-bold w-12 shrink-0">DEL</span> 
          <span className="truncate">/posts/1</span>
        </div>
      </div>
    </div>
  );
}
