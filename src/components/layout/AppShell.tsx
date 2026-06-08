import { ReactNode } from 'react';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { WorkspaceProvider } from '../../contexts/WorkspaceContext';
import { useStoredUser } from '../../lib/session';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const user = useStoredUser();

  if (!user) return null;

  return (
    <WorkspaceProvider key={user.id} userId={user.id}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Sidebar />
          <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
