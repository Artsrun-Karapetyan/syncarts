import type { ReactNode } from "react";

import { WorkspaceContext } from "./context";
import { useWorkspaceController } from "./useWorkspaceController";

export function WorkspaceProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const value = useWorkspaceController(userId);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
