import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "../components/layout/AppShell";
import { MergeRequestsScreen } from "../components/workspace/MergeRequestsScreen";
import { getAuthToken } from "../lib/auth";

export const Route = createFileRoute("/merge-requests")({
  component: MergeRequestsPage,
});

function MergeRequestsPage() {
  const navigate = useNavigate();
  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      void navigate({ to: "/login" });
    }
  }, [navigate, token]);

  if (!token) {
    return null;
  }

  return (
    <AppShell>
      <MergeRequestsScreen />
    </AppShell>
  );
}
