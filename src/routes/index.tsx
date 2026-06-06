import { createFileRoute } from '@tanstack/react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { Workspace } from '../components/layout/Workspace';

export const Route = createFileRoute('/')({
  component: Index,
});

import { RequestProvider } from '../contexts/RequestContext';

function Index() {
  return (
    <RequestProvider>
      <div className="flex h-screen w-screen bg-primary">
        <Sidebar />
        <Workspace />
      </div>
    </RequestProvider>
  );
}
