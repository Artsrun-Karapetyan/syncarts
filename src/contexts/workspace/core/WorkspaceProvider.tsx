import type { ReactNode } from "react";

import { WorkspaceContext } from "@/contexts/workspace/core/context";
import { useWorkspaceController } from "@/contexts/workspace/core/useWorkspaceController";

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
