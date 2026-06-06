import { ReactNode } from 'react';

import { Sidebar } from './Sidebar';
import { WorkspaceProvider } from '../../contexts/WorkspaceContext';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen w-screen bg-primary overflow-hidden">
        <Sidebar />
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {children}
        </div>
      </div>
    </WorkspaceProvider>
  );
}
