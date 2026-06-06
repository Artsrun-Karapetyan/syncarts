import React from 'react';

export function Sidebar() {
  return (
    <div className="w-64 border-r border-color h-full p-4 flex flex-col gap-4">
      <h1 className="font-bold text-lg text-primary">Syncarts</h1>
      <div className="text-sm text-secondary">API Client</div>
      
      <div className="mt-4 flex flex-col gap-2">
        <div className="text-sm font-semibold text-tertiary uppercase tracking-wider">History</div>
        <div className="text-sm text-secondary p-2 hover:bg-bg-secondary rounded cursor-pointer transition-fast">
          <span className="text-status-get font-bold mr-2">GET</span> /users
        </div>
        <div className="text-sm text-secondary p-2 hover:bg-bg-secondary rounded cursor-pointer transition-fast">
          <span className="text-status-post font-bold mr-2">POST</span> /login
        </div>
      </div>
    </div>
  );
}
