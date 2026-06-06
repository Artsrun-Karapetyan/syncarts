export function ResponseViewer() {
  return (
    <div className="glass-panel flex-1 p-4 flex flex-col overflow-auto">
      <div className="text-sm text-secondary mb-2 shrink-0 flex justify-between">
        <span>Response</span>
        <span className="text-tertiary text-xs">Status: --- | Time: --- ms</span>
      </div>
      <div className="flex-1 bg-bg-primary rounded border border-color p-4 overflow-auto">
        <pre className="text-sm font-mono text-tertiary">Awaiting request...</pre>
      </div>
    </div>
  );
}
