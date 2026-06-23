import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { Workspace } from "@/components/layout/Workspace";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  // We no longer redirect to /login immediately.
  // Users can use local workspaces without a token.
  // if (!token) {
  //   void navigate({ to: "/login" });
  // }

  return (
    <AppShell>
      <Workspace />
    </AppShell>
  );
}
