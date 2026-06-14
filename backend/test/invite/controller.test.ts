import { describe, expect, test } from "bun:test";

import {
  GenerateLinkSchema,
  InviteEmailSchema,
} from "../../src/invite/inviteSchemas.js";
import { normalizeWorkspaceIds } from "../../src/invite/normalizeWorkspaceIds.js";

describe("invite controller inputs", () => {
  test("generate input preserves snapshots", () => {
    const parsed = GenerateLinkSchema.parse({
      workspaceId: "workspace",
      workspaces: [
        {
          id: "workspace",
          name: "API",
          collections: [{ id: "collection" }],
          environments: [{ id: "env" }],
          globalVariables: [{ id: "global" }],
        },
      ],
      expiresInDays: 3,
    });

    expect(parsed).toEqual({
      workspaceId: "workspace",
      workspaces: [
        {
          id: "workspace",
          name: "API",
          collections: [{ id: "collection" }],
          environments: [{ id: "env" }],
          globalVariables: [{ id: "global" }],
        },
      ],
      expiresInDays: 3,
    });
  });

  test("generate input rejects empty workspaceIds", () => {
    expect(() => GenerateLinkSchema.parse({ workspaceIds: [] })).toThrow();
  });

  test("email input validates member address", () => {
    const parsed = InviteEmailSchema.parse({
      workspaceIds: ["workspace"],
      email: "member@test.com",
    });

    expect(parsed.email).toBe("member@test.com");
  });

  test("normalizes workspace ids from arrays and legacy id", () => {
    expect(normalizeWorkspaceIds({ workspaceIds: ["one", "", "two"] })).toEqual(
      ["one", "two"],
    );
    expect(normalizeWorkspaceIds({ workspaceId: "legacy" })).toEqual([
      "legacy",
    ]);
  });
});
