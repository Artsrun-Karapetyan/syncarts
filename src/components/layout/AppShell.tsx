import { ReactNode } from 'react';

import { Sidebar } from './Sidebar';
import { WorkspaceProvider } from '../../contexts/WorkspaceContext';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <WorkspaceProvider>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </WorkspaceProvider>
  );
}
