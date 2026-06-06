import { useRequest } from '../../contexts/RequestContext';

export function ResponseViewer() {
  const { response, error, isMutating } = useRequest();

  return (
    <div className="glass-panel flex-1 p-4 flex flex-col overflow-auto">
      <div className="text-sm text-secondary mb-2 shrink-0 flex justify-between">
        <span>Response</span>
        <span className="text-tertiary text-xs">
          Status: {response?.status || '---'} | Time: {response?.time_ms || '---'} ms
        </span>
      </div>
      <div className="flex-1 bg-bg-primary rounded border border-color p-4 overflow-auto">
        {isMutating && <pre className="text-sm font-mono text-tertiary">Sending request...</pre>}
        {error && <pre className="text-sm font-mono text-status-delete">{String(error)}</pre>}
        {!isMutating && !error && response && (
          <pre className="text-sm font-mono text-tertiary">{response.body}</pre>
        )}
        {!isMutating && !error && !response && (
          <pre className="text-sm font-mono text-tertiary">Awaiting request...</pre>
        )}
      </div>
    </div>
  );
}
