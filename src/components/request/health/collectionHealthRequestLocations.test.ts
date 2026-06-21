import { describe, expect, test } from "bun:test";

import { getCollectionHealthRequestLocations } from "./collectionHealthRequestLocations";

describe("getCollectionHealthRequestLocations", () => {
  test("flattens requests inside nested folders and maps them by request ID", () => {
    const mockCollection = {
      items: [
        {
          type: "folder" as const,
          id: "f1",
          name: "Users",
          items: [
            {
              type: "folder" as const,
              id: "f2",
              name: "Admin",
              items: [
                {
                  type: "request" as const,
                  id: "r1",
                  name: "Get Admin Info",
                  method: "GET",
                  url: "",
                  headers: [],
                  body: "",
                  bodyType: "none" as const,
                  description: "",
                  examples: [],
                },
              ],
            },
          ],
        },
        {
          type: "request" as const,
          id: "r2",
          name: "Root Request",
          method: "POST",
          url: "",
          headers: [],
          body: "",
          bodyType: "none" as const,
          description: "",
          examples: [],
        },
      ],
    } as any;

    const locations = getCollectionHealthRequestLocations(mockCollection);
    expect(locations.size).toBe(2);

    const loc1 = locations.get("r1");
    expect(loc1).toBeDefined();
    expect(loc1?.folderId).toBe("f2");
    expect(loc1?.folderPath).toBe("Users / Admin");

    const loc2 = locations.get("r2");
    expect(loc2).toBeDefined();
    expect(loc2?.folderId).toBeNull();
    expect(loc2?.folderPath).toBe("");
  });
});
