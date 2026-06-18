import { describe, expect, test } from "bun:test";

import type { Workspace } from "../core/types";
import { replaceRealtimeRequest } from "./workspaceRealtimeHelpers";

describe("workspace realtime helpers", () => {
  test("replaces an updated request in place", () => {
    const workspaces = [workspaceFixture()];

    const result = replaceRealtimeRequest(
      workspaces,
      "workspace",
      {
        type: "request",
        id: "request",
        collectionId: "collection",
        name: "Updated",
        method: "POST",
        url: "/updated",
        headers: [],
        body: "",
      },
      {
        type: "request.updated",
        workspaceId: "workspace",
        entityType: "request",
        entityId: "request",
        workspaceVersion: 5,
        updatedAt: "2026-06-17T00:00:00.000Z",
      },
    );

    expect(result.changed).toBe(true);
    expect(result.needsReload).toBe(false);
    expect(result.workspaces[0].version).toBe(5);
    expect(result.workspaces[0].collections[0].items[0]).toMatchObject({
      id: "request",
      name: "Updated",
      method: "POST",
    });
  });

  test("asks for reload when request moved", () => {
    const result = replaceRealtimeRequest(
      [workspaceFixture()],
      "workspace",
      {
        type: "request",
        id: "request",
        collectionId: "other",
        name: "Moved",
        method: "GET",
        url: "/moved",
        headers: [],
        body: "",
      },
      {
        type: "request.updated",
        workspaceId: "workspace",
        entityType: "request",
        entityId: "request",
      },
    );

    expect(result.changed).toBe(false);
    expect(result.needsReload).toBe(true);
  });
});

function workspaceFixture(): Workspace {
  return {
    id: "workspace",
    name: "Workspace",
    ownerId: "owner",
    version: 1,
    members: [],
    collections: [
      {
        id: "collection",
        name: "Collection",
        items: [
          {
            type: "request",
            id: "request",
            name: "Original",
            method: "GET",
            url: "/original",
            headers: [],
            body: "",
          },
        ],
      },
    ],
    environments: [],
    globalVariables: [],
  };
}
