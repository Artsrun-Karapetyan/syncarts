import { createFileRoute } from '@tanstack/react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { Workspace } from '../components/layout/Workspace';

export const Route = createFileRoute('/')({
  component: Index,
});

import { WorkspaceProvider } from '../contexts/WorkspaceContext';

function Index() {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen w-screen bg-primary overflow-hidden">
        <Sidebar />
        <Workspace />
      </div>
    </WorkspaceProvider>
  );
}
