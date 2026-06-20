import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { getAuthToken } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
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
      <ProfileScreen />
    </AppShell>
  );
}
