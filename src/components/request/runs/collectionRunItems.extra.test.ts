import { describe, expect, test } from "bun:test";

import { getCollectionRunItems } from "./collectionRunItems";

describe("collectionRunItems extra cases", () => {
  test("finds and returns items for a specific target folder", () => {
    const items = getCollectionRunItems(
      {
        id: "c1",
        items: [
          {
            type: "folder",
            id: "f1",
            name: "Folder 1",
            items: [
              {
                type: "folder",
                id: "f2",
                name: "Folder 2",
                items: [{ type: "request", id: "r1", name: "Req 1" }],
              },
            ],
          },
        ],
      } as any,
      "f2",
    );

    expect(items.length).toBe(1);
    expect(items[0].folderId).toBe("f2");
    expect(items[0].folderPath).toBe("Folder 1 / Folder 2");
    expect(items[0].request.id).toBe("r1");
  });

  test("returns empty if target folder is not found", () => {
    const items = getCollectionRunItems(
      {
        id: "c1",
        items: [],
      } as any,
      "missing",
    );
    expect(items.length).toBe(0);
  });
});
