import { describe, expect, test } from "bun:test";
import { moveSidebarEntityInWorkspace } from "./collectionMoveHelpers";

describe("collectionMoveHelpers extra cases", () => {
  test("moveCollection between positions", () => {
    const workspace = {
      collections: [{ id: "c1" }, { id: "c2" }, { id: "c3" }]
    } as any;
    
    // Move c1 after c2
    const res1 = moveSidebarEntityInWorkspace(workspace, { type: "collection", collectionId: "c1" }, { type: "collection", collectionId: "c2", position: "after" });
    expect(res1.collections.map((c: any) => c.id)).toEqual(["c2", "c1", "c3"]);
  });

  test("moveExample into another request", () => {
    const workspace = {
      collections: [
        {
          id: "c1",
          items: [
            { type: "request", id: "r1", examples: [{ id: "ex1" }] },
            { type: "request", id: "r2", examples: [] }
          ]
        }
      ]
    } as any;

    const res = moveSidebarEntityInWorkspace(
      workspace,
      { type: "example", collectionId: "c1", itemId: "ex1" },
      { type: "request", collectionId: "c1", itemId: "r2", position: "inside" }
    );
    expect(res.collections[0].items[0].examples.length).toBe(0);
    expect(res.collections[0].items[1].examples[0].id).toBe("ex1");
  });

  test("moveTreeItem deeply", () => {
    const workspace = {
      collections: [
        {
          id: "c1",
          items: [
            { type: "request", id: "r1" },
            { type: "folder", id: "f1", items: [] }
          ]
        }
      ]
    } as any;

    const res = moveSidebarEntityInWorkspace(
      workspace,
      { type: "request", collectionId: "c1", itemId: "r1" },
      { type: "folder", collectionId: "c1", itemId: "f1", position: "inside" }
    );
    expect(res.collections[0].items.length).toBe(1);
    expect(res.collections[0].items[0].items[0].id).toBe("r1");
  });
});
