import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { useOfflineWorkspaceMigration } from "./useOfflineWorkspaceMigration";

function Consumer({ props }: { props: any }) {
  useOfflineWorkspaceMigration(props);
  return <div>Migration active</div>;
}

describe("useOfflineWorkspaceMigration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("does nothing if storage is not hydrated or user is offline", () => {
    const setWorkspaces = mock();
    render(
      <Consumer
        props={{
          storageHydrated: false,
          userId: "offline",
          setWorkspaces,
          setTabsByWorkspace: mock(),
          setActiveTabIdByWorkspace: mock(),
          setActiveEnvIdByWorkspace: mock(),
        }}
      />,
    );
    expect(setWorkspaces).not.toHaveBeenCalled();
  });

  test("migrates offline local workspaces and tabs from localStorage when authenticated", () => {
    const offlineWorkspaces = [{ id: "w-off-1", type: "local" }];
    localStorage.setItem(
      "syncarts-workspaces-v3-offline",
      JSON.stringify(offlineWorkspaces),
    );

    const offlineTabs = { "w-off-1": [{ id: "tab-1" }] };
    localStorage.setItem(
      "syncarts-tabs-by-workspace-v3-offline",
      JSON.stringify(offlineTabs),
    );

    const setWorkspaces = mock((updater: any) => {
      updater([]);
    });
    const setTabsByWorkspace = mock();
    const setActiveTabIdByWorkspace = mock();
    const setActiveEnvIdByWorkspace = mock();

    render(
      <Consumer
        props={{
          storageHydrated: true,
          userId: "user-123",
          setWorkspaces,
          setTabsByWorkspace,
          setActiveTabIdByWorkspace,
          setActiveEnvIdByWorkspace,
        }}
      />,
    );

    expect(setWorkspaces).toHaveBeenCalled();
    expect(setTabsByWorkspace).toHaveBeenCalled();
  });
});
