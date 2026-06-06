import { useRequest } from '../../contexts/RequestContext';

export function ResponseViewer() {
  const { response, error, isMutating } = useRequest();

  return (
    <div className="glass-panel flex-1 p-6 flex flex-col overflow-auto rounded-lg">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Response</span>
        <div className="flex gap-4">
          <span className="text-xs font-mono text-tertiary">
            <span className="text-secondary">Status:</span> <span className={response?.status === 200 ? 'text-status-get' : 'text-status-delete'}>{response?.status || '---'}</span>
          </span>
          <span className="text-xs font-mono text-tertiary">
            <span className="text-secondary">Time:</span> {response?.time_ms || '---'} ms
          </span>
        </div>
      </div>
      <div className="flex-1 bg-primary rounded-md border border-color p-6 overflow-auto shadow-inner">
        {isMutating && <pre className="text-sm font-mono text-accent">Sending request...</pre>}
        {error && <pre className="text-sm font-mono text-status-delete">{String(error)}</pre>}
        {!isMutating && !error && response && (
          <pre className="text-sm font-mono text-primary leading-relaxed">
            {response.body}
          </pre>
        )} 
        {!isMutating && !error && !response && (
          <div className="h-full flex items-center justify-center">
            <span className="text-sm font-mono text-tertiary opacity-50">Awaiting request...</span>
          </div>
        )}
      </div>
    </div>
  );
}
