import { createRootRoute, Outlet } from "@tanstack/react-router";

import { DeepLinkHandler } from "../components/layout/DeepLinkHandler";

export const Route = createRootRoute({
  component: () => (
    <>
      <DeepLinkHandler />
      <Outlet />
    </>
  ),
});
