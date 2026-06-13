import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "../components/layout/AppShell";
import { Workspace } from "../components/layout/Workspace";
import { getAuthToken } from "../lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
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
      <Workspace />
    </AppShell>
  );
}
