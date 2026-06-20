import { describe, expect, test } from "bun:test";

import type { Workspace } from "@/contexts/workspace/core/types";
import {
  mergePolledRemoteWorkspace,
  removeUnavailableRemoteWorkspaces,
} from "@/contexts/workspace/sync/workspaceSyncMergeHelpers";

const workspace = (id: string, ownerId?: string): Workspace => ({
  id,
  name: id,
  ownerId,
  collections: [],
  environments: [],
});

describe("workspaceSyncMergeHelpers", () => {
  test("removes deleted and unavailable remote-backed workspaces", () => {
    const deletedWorkspaceIdsRef = { current: new Set(["deleted"]) };

    const result = removeUnavailableRemoteWorkspaces(
      [
        workspace("local-default"),
        workspace("remote-kept", "user"),
        workspace("remote-missing", "user"),
        workspace("deleted", "user"),
      ],
      new Set(["remote-kept"]),
      { deletedWorkspaceIdsRef, localDefaultWorkspaceId: "local-default" },
    );

    expect(result.map((item) => item.id)).toEqual([
      "local-default",
      "remote-kept",
    ]);
  });

  test("adds missing remote workspace during polling", () => {
    const nextLocals: Workspace[] = [];
    const lastSyncedSignaturesRef = { current: {} as Record<string, string> };
    const changed = mergePolledRemoteWorkspace(
      {
        id: "remote",
        name: "Remote",
        ownerId: "user",
        members: [],
        data: { collections: [], environments: [] },
      },
      nextLocals,
      false,
      {
        deletedWorkspaceIdsRef: { current: new Set<string>() },
        dirtyWorkspaceIdsRef: { current: new Set<string>() },
        lastSyncedSignaturesRef,
        localDefaultWorkspaceId: "local-default",
        syncingWorkspaceIdsRef: { current: new Set<string>() },
        userId: "user",
      },
    );

    expect(changed).toBe(true);
    expect(nextLocals[0]).toMatchObject({ id: "remote", name: "Remote" });
    expect(lastSyncedSignaturesRef.current.remote).toBeTruthy();
  });
});
