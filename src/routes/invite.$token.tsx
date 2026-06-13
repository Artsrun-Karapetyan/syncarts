import { createFileRoute, useParams } from "@tanstack/react-router";

import { AppShell } from "../components/layout/AppShell";
import { AcceptInviteContent } from "./-AcceptInviteContent";

export const Route = createFileRoute("/invite/$token")({
  component: AcceptInviteView,
});

function AcceptInviteView() {
  const { token } = useParams({ from: "/invite/$token" });

  return (
    <AppShell>
      <AcceptInviteContent token={token} />
    </AppShell>
  );
}
