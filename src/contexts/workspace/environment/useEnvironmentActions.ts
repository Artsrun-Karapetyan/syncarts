import type {
  Environment,
  EnvironmentVariable,
  Workspace,
} from "@/contexts/workspace/core/types";

interface EnvironmentActionsArgs {
  activeEnvironmentId: string | null;
  activeWorkspaceId: string;
  setActiveEnvIdByWorkspace: (
    value:
      | Record<string, string | null>
      | ((
          prev: Record<string, string | null>,
        ) => Record<string, string | null>),
  ) => void;
  updateWorkspaces: (updater: (prev: Workspace[]) => Workspace[]) => void;
}

export function useEnvironmentActions(args: EnvironmentActionsArgs) {
  const {
    activeEnvironmentId,
    activeWorkspaceId,
    setActiveEnvIdByWorkspace,
    updateWorkspaces,
  } = args;

  const setActiveEnvironmentId = (id: string | null) => {
    setActiveEnvIdByWorkspace((prev) => ({ ...prev, [activeWorkspaceId]: id }));
  };

  const createEnvironment = (
    name: string,
    variables: EnvironmentVariable[] = [],
  ) => {
    const newEnv: Environment = { id: crypto.randomUUID(), name, variables };
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          return { ...w, environments: [...(w.environments || []), newEnv] };
        }
        return w;
      }),
    );
    setActiveEnvironmentId(newEnv.id);
    return newEnv.id;
  };

  const updateEnvironment = (id: string, data: Partial<Environment>) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          return {
            ...w,
            environments: (w.environments || []).map((e) =>
              e.id === id ? { ...e, ...data } : e,
            ),
          };
        }
        return w;
      }),
    );
  };

  const deleteEnvironment = (id: string) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          return {
            ...w,
            environments: (w.environments || []).filter((e) => e.id !== id),
          };
        }
        return w;
      }),
    );
    if (activeEnvironmentId === id) {
      setActiveEnvironmentId(null);
    }
  };

  const updateGlobalVariables = (variables: EnvironmentVariable[]) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === activeWorkspaceId)
          return { ...w, globalVariables: variables };
        return w;
      }),
    );
  };

  return {
    setActiveEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    updateGlobalVariables,
  };
}
