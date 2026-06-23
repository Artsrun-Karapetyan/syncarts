import { describe, expect, mock, test } from "bun:test";

let moveCalled = false;
mock.module("@/contexts/workspace/collections/collectionMoveHelpers", () => ({
  moveSidebarEntityInWorkspace: () => {
    moveCalled = true;
    return { id: "w-active" };
  },
}));

import { useCollectionMoveActions } from "./useCollectionMoveActions";

describe("useCollectionMoveActions", () => {
  test("triggers updateWorkspaces and moves entities in active workspace only", () => {
    moveCalled = false;
    let updaterFn: any = null;
    const args = {
      activeWorkspaceId: "w-active",
      updateWorkspaces: (updater: any) => {
        updaterFn = updater;
      },
    };

    const { moveSidebarItem } = useCollectionMoveActions(args);
    moveSidebarItem({ id: "s1" } as any, { id: "t1" } as any);

    expect(updaterFn).toBeFunction();
    const prevWorkspaces = [
      { id: "w-active", name: "Active" },
      { id: "w-other", name: "Other" },
    ] as any[];

    const updated = updaterFn(prevWorkspaces);
    expect(moveCalled).toBe(true);
    expect(updated[0]).toEqual({ id: "w-active" });
    expect(updated[1]).toEqual({ id: "w-other", name: "Other" });
  });
});
