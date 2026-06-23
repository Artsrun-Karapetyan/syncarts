import { describe, expect, test } from "bun:test";

import {
  addExampleToItems,
  addRequestToFolder,
  duplicateExampleInItems,
  duplicateItemInItems,
  removeRequestFromItems,
  renameItemInItems,
  sortItemsByTarget,
  updateExampleInItems,
} from "./collectionItemHelpers";

describe("collectionItemHelpers extra cases 2", () => {
  test("removeRequestFromItems works deeply", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [
          { type: "request", id: "r1" },
          { type: "request", id: "r2" },
        ],
      },
    ] as any[];
    const res = removeRequestFromItems(items, "r1") as any[];
    expect(res[0].items.length).toBe(1);
    expect(res[0].items[0].id).toBe("r2");
  });

  test("addRequestToFolder works deeply", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [{ type: "folder", id: "f2", items: [] }],
      },
    ] as any[];
    const res = addRequestToFolder(items, "f2", {
      type: "request",
      id: "r1",
    } as any) as any[];
    expect(res[0].items[0].items.length).toBe(1);
  });

  test("renameItemInItems renames requests, folders, and examples", () => {
    const items = [
      { type: "folder", id: "f1", name: "old", items: [] },
      {
        type: "request",
        id: "r1",
        name: "old",
        examples: [{ id: "ex1", name: "old" }],
      },
    ] as any[];

    let res = renameItemInItems(items, "f1", "new") as any[];
    expect(res[0].name).toBe("new");

    res = renameItemInItems(items, "r1", "new") as any[];
    expect(res[1].name).toBe("new");

    res = renameItemInItems(items, "ex1", "new") as any[];
    expect(res[1].examples[0].name).toBe("new");
  });

  test("addExampleToItems adds example to specific request", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [{ type: "request", id: "r1", examples: [] }],
      },
    ] as any[];
    const res = addExampleToItems(
      items,
      "r1",
      "new ex",
      undefined,
      "ex1",
    ) as any[];
    expect(res[0].items[0].examples.length).toBe(1);
  });

  test("updateExampleInItems updates specific example", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [
          { type: "request", id: "r1", examples: [{ id: "ex1", name: "old" }] },
        ],
      },
    ] as any[];
    const res = updateExampleInItems(items, "r1", "ex1", {
      name: "new",
    }) as any[];
    expect(res[0].items[0].examples[0].name).toBe("new");
  });

  test("sortItemsByTarget sorts default and az", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [
          { type: "request", id: "r1", name: "B" },
          { type: "folder", id: "f2", name: "A", items: [] },
        ],
      },
    ] as any[];

    // Default puts folder first
    const res1 = sortItemsByTarget(items, "f1", "default") as any[];
    expect(res1[0].items[0].type).toBe("folder");

    // az puts A before B regardless of type
    const res2 = sortItemsByTarget(items, "f1", "az") as any[];
    expect(res2[0].items[0].name).toBe("A");
  });

  test("duplicateItemInItems duplicates request and folder", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        name: "fold",
        items: [{ type: "request", id: "r1", name: "req" }],
      },
    ] as any[];

    const res1 = duplicateItemInItems(items, "r1") as any[];
    expect(res1[0].items.length).toBe(2);
    expect(res1[0].items[1].name).toBe("req Copy");

    const res2 = duplicateItemInItems(items, "f1") as any[];
    expect(res2.length).toBe(2);
    expect(res2[1].name).toBe("fold Copy");
  });

  test("duplicateExampleInItems duplicates example", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [
          { type: "request", id: "r1", examples: [{ id: "ex1", name: "ex" }] },
        ],
      },
    ] as any[];
    const res = duplicateExampleInItems(items, "r1", "ex1") as any[];
    expect(res[0].items[0].examples.length).toBe(2);
    expect(res[0].items[0].examples[1].name).toBe("ex Copy");
  });
});
