import { describe, expect, it } from "bun:test";

import type { Workspace } from "@/contexts/workspace/core/types";
import {
  isMemberWorkspace,
  isSharedWorkspace,
} from "@/contexts/workspace/sync/sharing";

const workspace: Workspace = {
  id: "workspace-1",
  name: "Team",
  ownerId: "owner-1",
  collections: [],
  environments: [],
  members: [{ userId: "member-1", role: "EDITOR" }],
};

describe("sharing", () => {
  it("detects shared workspaces", () => {
    expect(isSharedWorkspace(workspace)).toBe(true);
    expect(isSharedWorkspace({ ...workspace, members: [] })).toBe(false);
    expect(isSharedWorkspace()).toBe(false);
  });

  it("detects member workspaces for non-owners", () => {
    expect(isMemberWorkspace(workspace, "member-1")).toBe(true);
    expect(isMemberWorkspace(workspace, "owner-1")).toBe(false);
    expect(isMemberWorkspace(workspace, "missing")).toBe(false);
  });
});
