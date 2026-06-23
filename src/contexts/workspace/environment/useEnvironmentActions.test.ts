import { describe, expect, mock, test } from "bun:test";

import type { Workspace } from "@/contexts/workspace/core/types";

import { useEnvironmentActions } from "./useEnvironmentActions";

describe("useEnvironmentActions", () => {
  const defaultArgs = () => {
    const activeEnvIdByWorkspace: Record<string, string | null> = {
      "ws-1": "env-1",
    };
    const setActiveEnvIdByWorkspace = mock((updater: any) => {
      if (typeof updater === "function") {
        Object.assign(activeEnvIdByWorkspace, updater(activeEnvIdByWorkspace));
      } else {
        Object.assign(activeEnvIdByWorkspace, updater);
      }
    });

    const workspaces: Workspace[] = [
      {
        id: "ws-1",
        name: "Workspace 1",
        collections: [],
        environments: [{ id: "env-1", name: "Env 1", variables: [] }],
      },
    ];

    const updateWorkspaces = mock((updater: any) => {
      workspaces.splice(0, workspaces.length, ...updater(workspaces));
    });

    return {
      activeEnvironmentId: "env-1",
      activeWorkspaceId: "ws-1",
      setActiveEnvIdByWorkspace,
      updateWorkspaces,
      workspaces,
      activeEnvIdByWorkspace,
    };
  };

  test("setActiveEnvironmentId updates the active env map", () => {
    const args = defaultArgs();
    const actions = useEnvironmentActions(args);

    actions.setActiveEnvironmentId("env-2");
    expect(args.setActiveEnvIdByWorkspace).toHaveBeenCalled();
    expect(args.activeEnvIdByWorkspace["ws-1"]).toBe("env-2");
  });

  test("createEnvironment appends new environment to active workspace and sets it active", () => {
    const args = defaultArgs();
    const actions = useEnvironmentActions(args);

    const newId = actions.createEnvironment("New Env", [
      {
        key: "k",
        value: "v",
        enabled: true,
        id: "",
      },
    ]);
    expect(newId).toBeDefined();
    expect(args.updateWorkspaces).toHaveBeenCalled();
    expect(args.workspaces[0].environments?.length).toBe(2);
    expect(args.workspaces[0].environments?.[1].name).toBe("New Env");
  });

  test("updateEnvironment updates environment properties", () => {
    const args = defaultArgs();
    const actions = useEnvironmentActions(args);

    actions.updateEnvironment("env-1", { name: "Renamed Env" });
    expect(args.updateWorkspaces).toHaveBeenCalled();
    expect(args.workspaces[0].environments?.[0].name).toBe("Renamed Env");
  });

  test("deleteEnvironment removes environment and resets active environment if matching", () => {
    const args = defaultArgs();
    const actions = useEnvironmentActions(args);

    actions.deleteEnvironment("env-1");
    expect(args.updateWorkspaces).toHaveBeenCalled();
    expect(args.workspaces[0].environments?.length).toBe(0);
    expect(args.activeEnvIdByWorkspace["ws-1"]).toBeNull();
  });

  test("updateGlobalVariables updates global variables on active workspace", () => {
    const args = defaultArgs();
    const actions = useEnvironmentActions(args);

    actions.updateGlobalVariables([
      {
        key: "g",
        value: "1",
        enabled: true,
        id: "",
      },
    ]);
    expect(args.updateWorkspaces).toHaveBeenCalled();
    expect(args.workspaces[0].globalVariables?.[0].key).toBe("g");
  });
});
