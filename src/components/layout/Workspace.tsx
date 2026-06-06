import React from 'react';

export function Workspace() {
  return (
    <div className="flex-1 p-4 flex flex-col gap-4 h-full overflow-hidden">
      {/* Top Request Bar */}
      <div className="glass-panel p-4 flex gap-2 shrink-0">
        <select className="input bg-bg-tertiary font-bold cursor-pointer">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <input className="input w-full font-mono" placeholder="https://api.example.com/v1/users" />
        <button className="btn btn-primary px-6">Send</button>
      </div>
      
      {/* Response Area */}
      <div className="glass-panel flex-1 p-4 flex flex-col min-h-0">
        <div className="text-sm text-secondary mb-2 shrink-0 flex justify-between">
          <span>Response</span>
          <span className="text-tertiary text-xs">Status: --- | Time: --- ms</span>
        </div>
        <div className="flex-1 bg-bg-primary rounded border border-color p-4 overflow-auto">
          <pre className="text-sm font-mono text-tertiary">Awaiting request...</pre>
        </div>
      </div>
    </div>
  );
}
