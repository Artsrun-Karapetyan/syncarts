import { describe, expect, test } from "bun:test";
import { dragRowStyle } from "./sidebarDragStyles";

describe("sidebarDragStyles", () => {
  const base = { opacity: 1, boxShadow: "none" };
  const entity1 = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
  const entity2 = { type: "folder" as const, collectionId: "c1", itemId: "f2" };

  test("returns base when not dragging and not drop target", () => {
    expect(dragRowStyle({ base, entity: entity1, draggingEntity: null, dropTarget: null })).toEqual(base);
    expect(dragRowStyle({ base, entity: entity1, draggingEntity: entity2, dropTarget: { ...entity2, position: "before" } })).toEqual(base);
  });

  test("returns lowered opacity when dragging", () => {
    const style = dragRowStyle({ base, entity: entity1, draggingEntity: entity1, dropTarget: null });
    expect(style.opacity).toBe(0.45);
  });

  test("returns box shadow when drop target inside", () => {
    const style = dragRowStyle({ base, entity: entity1, draggingEntity: entity2, dropTarget: { ...entity1, position: "inside" } });
    expect(style.boxShadow).toBe("inset 0 0 0 1px var(--accent-primary)");
  });

  test("returns box shadow when drop target before", () => {
    const style = dragRowStyle({ base, entity: entity1, draggingEntity: entity2, dropTarget: { ...entity1, position: "before" } });
    expect(style.boxShadow).toBe("inset 0 2px 0 var(--accent-primary)");
  });

  test("returns box shadow when drop target after", () => {
    const style = dragRowStyle({ base, entity: entity1, draggingEntity: entity2, dropTarget: { ...entity1, position: "after" } });
    expect(style.boxShadow).toBe("inset 0 -2px 0 var(--accent-primary)");
  });
});
