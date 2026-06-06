import { useWorkspace } from '../../contexts/WorkspaceContext';

export function ResponseViewer() {
  const { activeTab, error, isMutating } = useWorkspace();
  const response = activeTab?.response;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-status-get';
    if (status >= 300 && status < 400) return 'text-status-put';
    if (status >= 400) return 'text-status-delete';
    return 'text-primary';
  };

  const formatStatusText = (status: number, text: string) => {
    const statusStr = status.toString();
    if (text.startsWith(statusStr)) {
      return text.substring(statusStr.length).trim();
    }
    return text;
  };

  return (
    <div className="glass-panel flex-1 p-4 flex flex-col overflow-auto rounded-lg">
      <div className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3 shrink-0 flex justify-between">
        <span>Response</span>
        <div className="flex gap-4">
          <span className="text-secondary">
            Status: {response ? <span className={`font-bold ${getStatusColor(response.status)}`}>{response.status} {formatStatusText(response.status, response.status_text)}</span> : '---'}
          </span>
          <span className="text-secondary">
            Time: {response ? <span className="text-accent">{response.time_ms} ms</span> : '--- ms'}
          </span>
        </div>
      </div>
      <div className="flex-1 bg-primary rounded-md border border-color p-6 overflow-auto shadow-inner">
        {isMutating && <pre className="text-sm font-mono text-accent">Sending request...</pre>}
        {error && <pre className="text-sm font-mono text-status-delete">{String(error)}</pre>}
        {!isMutating && !error && response && (
          <pre className="text-sm font-mono whitespace-pre-wrap text-primary leading-relaxed">
            {response.body}
          </pre>
        )}
        {!isMutating && !error && !response && (
          <div className="h-full flex items-center justify-center text-sm font-mono text-tertiary">
            Awaiting request...
          </div>
        )}
      </div>
    </div>
  );
}
