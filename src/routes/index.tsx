import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="flex h-screen w-screen bg-primary">
      {/* Sidebar will go here */}
      <div className="w-64 border-r border-color h-full p-4 flex flex-col gap-4">
        <h1 className="font-bold text-lg text-primary">Syncarts</h1>
        <div className="text-sm text-secondary">API Client</div>
      </div>
      
      {/* Main Workspace will go here */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="glass-panel p-4 flex gap-2">
          <button className="btn">GET</button>
          <input className="input w-full" placeholder="https://api.example.com" />
          <button className="btn btn-primary">Send</button>
        </div>
        
        <div className="glass-panel flex-1 p-4">
          <div className="text-sm text-secondary mb-2">Response</div>
          <pre className="text-sm font-mono text-tertiary">Awaiting request...</pre>
        </div>
      </div>
    </div>
  );
}
