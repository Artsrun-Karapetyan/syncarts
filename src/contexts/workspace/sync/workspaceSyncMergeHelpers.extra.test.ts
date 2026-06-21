import { describe, expect, test } from "bun:test";

import { mapRemoteWorkspace } from "./syncHelpers";
import {
  mergeInitialRemoteWorkspace,
  mergePolledRemoteWorkspace,
} from "./workspaceSyncMergeHelpers";

describe("workspaceSyncMergeHelpers extra cases", () => {
  test("mergeInitialRemoteWorkspace isViewer returning hasChanges", () => {
    const refs = {
      dirtyWorkspaceIdsRef: { current: new Set<string>() },
      lastSyncedSignaturesRef: { current: {} },
      syncingWorkspaceIdsRef: { current: new Set<string>() },
      userId: "u1",
    } as any;

    const remote = {
      id: "w1",
      name: "local",
      ownerId: "u2",
      members: [{ userId: "u1", role: "VIEWER" }],
    };
    const nextLocals = [
      {
        id: "w1",
        name: "local",
        ownerId: "u2",
        members: [{ userId: "u1", role: "VIEWER" }],
      },
    ] as any[];
    const mapped = mapRemoteWorkspace(remote, nextLocals[0]);
    nextLocals[0] = mapped;

    // JSON.stringify will match exactly now, so it returns hasChanges (false)
    const result = mergeInitialRemoteWorkspace(remote, nextLocals, false, refs);
    expect(result).toBe(false);
  });

  test("mergePolledRemoteWorkspace handles missing lastSyncedSignature but local matches remote", () => {
    const refs = {
      dirtyWorkspaceIdsRef: { current: new Set<string>() },
      lastSyncedSignaturesRef: { current: {} },
      syncingWorkspaceIdsRef: { current: new Set<string>() },
      userId: "u1",
    } as any;

    const nextLocals = [{ id: "w1", name: "local", ownerId: "u1" }] as any[];
    const remote = {
      id: "w1",
      name: "local",
      ownerId: "u1",
      data: { collections: [] },
    };

    const result = mergePolledRemoteWorkspace(remote, nextLocals, false, refs);
    expect(result).toBe(true); // Since localSignature !== remoteSignature for empty vs data
  });

  test("mergePolledRemoteWorkspace handles remoteSignature !== lastSyncedSignature", () => {
    const refs = {
      dirtyWorkspaceIdsRef: { current: new Set<string>() },
      lastSyncedSignaturesRef: { current: { w1: "old_sig" } },
      syncingWorkspaceIdsRef: { current: new Set<string>() },
      userId: "u1",
    } as any;

    const nextLocals = [{ id: "w1", name: "local", ownerId: "u1" }] as any[];
    const remote = {
      id: "w1",
      name: "local",
      ownerId: "u1",
      data: { collections: [] },
    };

    const result = mergePolledRemoteWorkspace(remote, nextLocals, false, refs);
    expect(result).toBe(true);
  });
});
