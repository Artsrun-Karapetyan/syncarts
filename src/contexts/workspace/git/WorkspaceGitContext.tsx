import { createContext, ReactNode, useContext } from "react";

import { useWorkspaceGit } from "./useWorkspaceGit";

type WorkspaceGitContextValue = ReturnType<typeof useWorkspaceGit>;

const WorkspaceGitContext = createContext<WorkspaceGitContextValue | null>(null);

export function WorkspaceGitProvider({ children }: { children: ReactNode }) {
  const git = useWorkspaceGit();
  return (
    <WorkspaceGitContext.Provider value={git}>
      {children}
    </WorkspaceGitContext.Provider>
  );
}

export function useWorkspaceGitContext(): WorkspaceGitContextValue {
  const ctx = useContext(WorkspaceGitContext);
  if (!ctx) throw new Error("useWorkspaceGitContext must be used inside WorkspaceGitProvider");
  return ctx;
}
