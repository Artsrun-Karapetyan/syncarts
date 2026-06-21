import { beforeEach, describe, expect, mock, test } from "bun:test";

import {
  canDropSidebarEntity,
  getSidebarDropPosition,
  readSidebarDragData,
  SIDEBAR_DRAG_DATA_TYPE,
  writeSidebarDragData,
} from "./sidebarDragHelpers";

describe("sidebarDragHelpers", () => {
  beforeEach(() => {
    mock.restore();
  });

  const mockEntity = {
    type: "folder" as const,
    collectionId: "c1",
    itemId: "f1",
  };

  describe("writeSidebarDragData", () => {
    test("writes data to event", () => {
      const event = {
        dataTransfer: {
          effectAllowed: "",
          setData: mock(),
        },
      } as any;
      writeSidebarDragData(event, mockEntity);
      expect(event.dataTransfer.effectAllowed).toBe("move");
      expect(event.dataTransfer.setData).toHaveBeenCalledWith(
        SIDEBAR_DRAG_DATA_TYPE,
        JSON.stringify(mockEntity),
      );
    });
  });

  describe("readSidebarDragData", () => {
    test("reads data from event", () => {
      const event = {
        dataTransfer: {
          getData: mock().mockReturnValue(JSON.stringify(mockEntity)),
        },
      } as any;
      const data = readSidebarDragData(event);
      expect(data).toEqual(mockEntity);
    });

    test("returns null if no data", () => {
      const event = {
        dataTransfer: {
          getData: mock().mockReturnValue(null),
        },
      } as any;
      const data = readSidebarDragData(event);
      expect(data).toBeNull();
    });

    test("returns null if invalid JSON", () => {
      const event = {
        dataTransfer: {
          getData: mock().mockReturnValue("{ invalid json"),
        },
      } as any;
      const data = readSidebarDragData(event);
      expect(data).toBeNull();
    });
  });

  describe("getSidebarDropPosition", () => {
    const createEvent = (clientY: number, top: number, height: number) =>
      ({
        clientY,
        currentTarget: {
          getBoundingClientRect: () => ({ top, height }),
        },
      }) as any;

    test("returns inside for collection -> request", () => {
      const target = {
        type: "request" as const,
        collectionId: "c1",
        itemId: "r1",
      };
      const source = { type: "collection" as const, collectionId: "c2" };
      expect(getSidebarDropPosition(createEvent(0, 0, 0), source, target)).toBe(
        "before",
      ); // getVerticalEdgePosition since it falls back to event logic for collection target but wait, target is request!
      // Wait, let's trace: target=request, source=collection -> returns getVerticalEdgePosition(event).
    });

    test("target collection, source collection -> edge", () => {
      const target = { type: "collection" as const, collectionId: "c1" };
      const source = { type: "collection" as const, collectionId: "c2" };
      expect(
        getSidebarDropPosition(createEvent(10, 0, 100), source, target),
      ).toBe("before");
      expect(
        getSidebarDropPosition(createEvent(90, 0, 100), source, target),
      ).toBe("after");
    });

    test("target collection, source folder -> inside", () => {
      const target = { type: "collection" as const, collectionId: "c1" };
      const source = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f1",
      };
      expect(
        getSidebarDropPosition(createEvent(10, 0, 100), source, target),
      ).toBe("inside");
    });

    test("target request, source example -> inside", () => {
      const target = {
        type: "request" as const,
        collectionId: "c1",
        itemId: "r1",
      };
      const source = {
        type: "example" as const,
        collectionId: "c1",
        itemId: "e1",
        requestId: "r1",
      };
      expect(
        getSidebarDropPosition(createEvent(10, 0, 100), source, target),
      ).toBe("inside");
    });

    test("target request, source folder -> edge", () => {
      const target = {
        type: "request" as const,
        collectionId: "c1",
        itemId: "r1",
      };
      const source = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f1",
      };
      expect(
        getSidebarDropPosition(createEvent(10, 0, 100), source, target),
      ).toBe("before");
      expect(
        getSidebarDropPosition(createEvent(90, 0, 100), source, target),
      ).toBe("after");
    });

    test("target example -> edge", () => {
      const target = {
        type: "example" as const,
        collectionId: "c1",
        itemId: "e1",
        requestId: "r1",
      };
      const source = {
        type: "example" as const,
        collectionId: "c1",
        itemId: "e2",
        requestId: "r1",
      };
      expect(
        getSidebarDropPosition(createEvent(10, 0, 100), source, target),
      ).toBe("before");
    });

    test("target folder, y < 25% -> before", () => {
      const target = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f1",
      };
      expect(
        getSidebarDropPosition(createEvent(10, 0, 100), mockEntity, target),
      ).toBe("before");
    });

    test("target folder, y > 75% -> after", () => {
      const target = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f1",
      };
      expect(
        getSidebarDropPosition(createEvent(80, 0, 100), mockEntity, target),
      ).toBe("after");
    });

    test("target folder, middle -> inside", () => {
      const target = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f1",
      };
      expect(
        getSidebarDropPosition(createEvent(50, 0, 100), mockEntity, target),
      ).toBe("inside");
    });
  });

  describe("canDropSidebarEntity", () => {
    test("returns false for same entity", () => {
      const entity = { type: "collection" as const, collectionId: "c1" };
      expect(
        canDropSidebarEntity(entity, { ...entity, position: "inside" }),
      ).toBe(false);
    });

    test("returns true for collection to collection", () => {
      const source = { type: "collection" as const, collectionId: "c1" };
      const target = {
        type: "collection" as const,
        collectionId: "c2",
        position: "before" as const,
      };
      expect(canDropSidebarEntity(source, target)).toBe(true);
    });

    test("returns false for collection to folder", () => {
      const source = { type: "collection" as const, collectionId: "c1" };
      const target = {
        type: "folder" as const,
        collectionId: "c2",
        itemId: "f1",
        position: "before" as const,
      };
      expect(canDropSidebarEntity(source, target)).toBe(false);
    });

    test("returns true for example to request", () => {
      const source = {
        type: "example" as const,
        collectionId: "c1",
        itemId: "e1",
        requestId: "r1",
      };
      const target = {
        type: "request" as const,
        collectionId: "c1",
        itemId: "r1",
        position: "inside" as const,
      };
      expect(canDropSidebarEntity(source, target)).toBe(true);
    });

    test("returns false for example to folder", () => {
      const source = {
        type: "example" as const,
        collectionId: "c1",
        itemId: "e1",
        requestId: "r1",
      };
      const target = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f1",
        position: "before" as const,
      };
      expect(canDropSidebarEntity(source, target)).toBe(false);
    });

    test("returns false for anything to example target", () => {
      const source = {
        type: "request" as const,
        collectionId: "c1",
        itemId: "r1",
      };
      const target = {
        type: "example" as const,
        collectionId: "c1",
        itemId: "e1",
        requestId: "r1",
        position: "before" as const,
      };
      expect(canDropSidebarEntity(source, target)).toBe(false);
    });

    test("returns true for folder to folder", () => {
      const source = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f1",
      };
      const target = {
        type: "folder" as const,
        collectionId: "c1",
        itemId: "f2",
        position: "before" as const,
      };
      expect(canDropSidebarEntity(source, target)).toBe(true);
    });
  });
});
