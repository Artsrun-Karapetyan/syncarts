import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth/AuthScreen";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return <AuthScreen mode="register" />;
}
