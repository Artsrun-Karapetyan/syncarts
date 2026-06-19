import { describe, expect, test } from "bun:test";

import type { SavedRequest } from "../../../contexts/WorkspaceContext";
import { getCollectionRunItems } from "./collectionRunItems";

describe("getCollectionRunItems", () => {
  test("flattens collection requests in sidebar order", () => {
    const items = getCollectionRunItems({
      id: "collection",
      name: "API",
      items: [
        request("a", "Root"),
        {
          type: "folder",
          id: "folder",
          name: "Users",
          items: [request("b", "Nested")],
        },
      ],
    });

    expect(items.map((item) => item.request.id)).toEqual(["a", "b"]);
    expect(items[1]).toMatchObject({
      folderId: "folder",
      folderPath: "Users",
    });
    expect(items[1].tab).toMatchObject({
      collectionId: "collection",
      folderId: "folder",
      savedRequestId: "b",
    });
  });
});

function request(id: string, name: string): SavedRequest {
  return {
    type: "request",
    id,
    name,
    method: "GET",
    url: "/users",
    headers: [],
    body: "",
  };
}
