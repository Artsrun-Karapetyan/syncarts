import { createFileRoute } from '@tanstack/react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { Workspace } from '../components/layout/Workspace';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="flex h-screen w-screen bg-primary">
      <Sidebar />
      <Workspace />
    </div>
  );
}
