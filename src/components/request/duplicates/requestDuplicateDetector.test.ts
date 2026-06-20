import { describe, expect, test } from "bun:test";

import { findRequestDuplicateGroups } from "@/components/request/duplicates/requestDuplicateDetector";
import type { Collection } from "@/contexts/workspace/core/types";

describe("findRequestDuplicateGroups", () => {
  test("finds exact duplicates with sorted query params", () => {
    const groups = findRequestDuplicateGroups(
      collection([
        request("a", "List users", "GET", "{{base_url}}/users?page=1&limit=10"),
        request(
          "b",
          "Users copy",
          "GET",
          "https://api.test/users?limit=10&page=1",
        ),
        request("c", "Create user", "POST", "{{base_url}}/users"),
      ]),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      kind: "exact",
      key: "GET /users?limit=10&page=1",
    });
    expect(groups[0].requests.map((match) => match.request.id)).toEqual([
      "a",
      "b",
    ]);
  });

  test("finds similar path duplicates", () => {
    const groups = findRequestDuplicateGroups(
      collection([
        request("a", "Get user", "GET", "{{base_url}}/users/:id"),
        request("b", "Get user sample", "GET", "{{base_url}}/users/123"),
        request("c", "Get team", "GET", "{{base_url}}/teams/123"),
      ]),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      kind: "similar",
      key: "GET /users/:param",
    });
  });

  test("keeps folder location for nested duplicates", () => {
    const groups = findRequestDuplicateGroups({
      ...collection([]),
      items: [
        {
          type: "folder",
          id: "folder",
          name: "Admin",
          items: [
            request("a", "List users", "GET", "/users"),
            request("b", "List users copy", "GET", "/users"),
          ],
        },
      ],
    });

    expect(groups[0].requests[0]).toMatchObject({
      folderId: "folder",
      folderPath: "Admin",
    });
  });
});

function collection(items: Collection["items"]): Collection {
  return {
    id: "collection",
    name: "API",
    items,
  };
}

function request(
  id: string,
  name: string,
  method: string,
  url: string,
): Collection["items"][number] {
  return {
    type: "request",
    id,
    name,
    method,
    url,
    headers: [],
    body: "",
  };
}
