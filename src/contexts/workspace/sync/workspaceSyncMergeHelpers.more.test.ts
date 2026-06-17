import { describe, expect, test } from "bun:test";

import type { Workspace } from "../core/types";
import {
  mergeInitialRemoteWorkspace,
  mergePolledRemoteWorkspace,
} from "./workspaceSyncMergeHelpers";

const remoteWorkspaceData = {
  id: "remote",
  name: "Remote",
  ownerId: "user",
  members: [],
  data: { collections: [], environments: [] },
};

function createArgs() {
  return {
    deletedWorkspaceIdsRef: { current: new Set<string>() },
    dirtyWorkspaceIdsRef: { current: new Set<string>() },
    lastSyncedSignaturesRef: { current: {} as Record<string, string> },
    localDefaultWorkspaceId: "local-default",
    syncingWorkspaceIdsRef: { current: new Set<string>() },
    userId: "user",
  };
}

describe("workspaceSyncMergeHelpers extra cases", () => {
  test("mergeInitialRemoteWorkspace adds missing remote", () => {
    const nextLocals: Workspace[] = [];
    const args = createArgs();
    const changed = mergeInitialRemoteWorkspace(
      remoteWorkspaceData,
      nextLocals,
      false,
      args,
    );
    expect(changed).toBe(true);
    expect(nextLocals[0].id).toBe("remote");
  });

  test("mergeInitialRemoteWorkspace handles viewer without changes", () => {
    const local = {
      id: "remote",
      name: "Remote",
      ownerId: "owner",
      members: [],
      collections: [],
      environments: [],
    };
    const nextLocals = [local];
    const args = createArgs();
    const remote = {
      ...remoteWorkspaceData,
      ownerId: "owner",
      members: [{ userId: "user", role: "VIEWER" }],
    };

    const changed = mergeInitialRemoteWorkspace(
      remote,
      nextLocals,
      false,
      args,
    );
    expect(changed).toBe(true);
  });

  test("mergeInitialRemoteWorkspace with pending local changes", () => {
    const local = {
      id: "remote",
      name: "Local",
      ownerId: "user",
      members: [],
      collections: [],
      environments: [],
    };
    const nextLocals = [local];
    const args = createArgs();
    args.dirtyWorkspaceIdsRef.current.add("remote");

    const changed = mergeInitialRemoteWorkspace(
      remoteWorkspaceData,
      nextLocals,
      false,
      args,
    );
    expect(changed).toBe(true);
  });

  test("mergeInitialRemoteWorkspace local signature matches remote but different members", () => {
    const local = {
      id: "remote",
      name: "Remote",
      ownerId: "user",
      members: [],
      collections: [],
      environments: [],
    };
    const nextLocals = [local];
    const args = createArgs();
    const remote = {
      ...remoteWorkspaceData,
      members: [{ userId: "other", role: "VIEWER" }],
    };

    const changed = mergeInitialRemoteWorkspace(
      remote,
      nextLocals,
      false,
      args,
    );
    expect(changed).toBe(true);
    expect(nextLocals[0].members).toHaveLength(1);
  });

  test("mergePolledRemoteWorkspace updates when remote signature changes", () => {
    const local = {
      id: "remote",
      name: "Local",
      ownerId: "user",
      members: [],
      collections: [],
      environments: [],
    };
    const nextLocals = [local];
    const args = createArgs();
    args.lastSyncedSignaturesRef.current["remote"] = "old-sig";

    const remote = { ...remoteWorkspaceData, name: "New Remote" };
    const changed = mergePolledRemoteWorkspace(remote, nextLocals, false, args);

    expect(changed).toBe(true);
    expect(nextLocals[0].name).toBe("New Remote");
  });

  test("mergePolledRemoteWorkspace keeps local data for meta-only remote", () => {
    const local = {
      id: "remote",
      name: "Remote",
      ownerId: "user",
      version: 1,
      members: [],
      collections: [{ id: "collection", name: "API", items: [] }],
      environments: [],
    };
    const nextLocals = [local];
    const args = createArgs();
    args.lastSyncedSignaturesRef.current["remote"] = "local-sig";

    const changed = mergePolledRemoteWorkspace(
      {
        id: "remote",
        name: "Remote",
        ownerId: "user",
        version: 2,
        members: [],
      },
      nextLocals,
      false,
      args,
    );

    expect(changed).toBe(true);
    expect(nextLocals[0].version).toBe(2);
    expect(nextLocals[0].collections).toEqual(local.collections);
    expect(args.lastSyncedSignaturesRef.current["remote"]).toBe("local-sig");
  });

  test("mergePolledRemoteWorkspace handles viewer with updates", () => {
    const local = {
      id: "remote",
      name: "Local",
      ownerId: "owner",
      members: [],
      collections: [],
      environments: [],
    };
    const nextLocals = [local];
    const args = createArgs();
    const remote = {
      ...remoteWorkspaceData,
      ownerId: "owner",
      members: [{ userId: "user", role: "VIEWER" }],
    };

    const changed = mergePolledRemoteWorkspace(remote, nextLocals, false, args);
    expect(changed).toBe(true);
  });
});
