import { describe, expect, it } from "bun:test";

import type { Workspace } from "@/contexts/workspace/core/types";
import {
  getSyncSignature,
  normalizeLegacyWorkspaces,
  shouldSkipLegacyDefaultRemote,
} from "@/contexts/workspace/sync/syncHelpers";

const localDefault: Workspace = {
  id: "local-default",
  name: "My Workspace",
  ownerId: "user-1",
  collections: [],
  environments: [],
};

describe("syncHelpers legacy cases", () => {
  it("skips the legacy default remote when it duplicates the local default", () => {
    expect(
      shouldSkipLegacyDefaultRemote(
        {
          id: "default",
          name: "My Workspace",
          ownerId: "user-1",
          data: { collections: [] },
        },
        [localDefault],
        "local-default",
        "user-1",
      ),
    ).toBe(true);
  });

  it("removes duplicate and legacy default workspaces", () => {
    expect(
      normalizeLegacyWorkspaces(
        [
          localDefault,
          localDefault,
          {
            id: "default",
            name: "My Workspace",
            collections: [],
            environments: [],
          },
        ],
        "local-default",
        "user-1",
      ),
    ).toEqual([localDefault]);
  });

  it("serializes sync signatures", () => {
    expect(getSyncSignature({ name: "Team", collections: [] })).toBe(
      '{"name":"Team","collections":[]}',
    );
  });
});
