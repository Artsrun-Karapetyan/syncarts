import { describe, expect, it } from "bun:test";

import type { Workspace } from "../core/types";
import {
  canSyncWorkspace,
  getRemoteSyncPayload,
  getWorkspaceSyncPayload,
  mapRemoteWorkspace,
} from "./syncHelpers";

const workspace: Workspace = {
  id: "workspace-1",
  name: "Team",
  ownerId: "owner-1",
  collections: [],
  environments: [],
  globalVariables: [],
  members: [
    { userId: "editor-1", role: "EDITOR" },
    { userId: "viewer-1", role: "VIEWER" },
  ],
};

describe("syncHelpers", () => {
  it("maps remote workspace data onto a workspace", () => {
    expect(
      mapRemoteWorkspace({
        id: "remote-1",
        name: "Remote",
        ownerId: "owner-1",
        members: [],
        data: { collections: [{ id: "collection-1" }], environments: [] },
      }),
    ).toMatchObject({
      id: "remote-1",
      name: "Remote",
      ownerId: "owner-1",
      collections: [{ id: "collection-1" }],
      environments: [],
      globalVariables: [],
    });
  });

  it("builds local and remote sync payloads", () => {
    expect(getWorkspaceSyncPayload(workspace)).toEqual({
      name: "Team",
      ownerId: "owner-1",
      collections: [],
      environments: [],
      globalVariables: [],
    });

    expect(getRemoteSyncPayload({ name: "Remote", data: {} })).toEqual({
      name: "Remote",
      ownerId: undefined,
      collections: [],
      environments: [],
      globalVariables: [],
    });
  });

  it("allows owners and editors to sync but blocks viewers", () => {
    expect(canSyncWorkspace(workspace, "owner-1")).toBe(true);
    expect(canSyncWorkspace(workspace, "editor-1")).toBe(true);
    expect(canSyncWorkspace(workspace, "viewer-1")).toBe(false);
  });
});
