import { describe, expect, test } from "bun:test";
import { getWatchTarget } from "./sidebarWatchTarget";
import type { CtxMenuState } from "@/components/layout/sidebar/types";

describe("sidebarWatchTarget", () => {
  test("returns collection target", () => {
    const ctx: CtxMenuState = {
      x: 0,
      y: 0,
      itemType: "collection",
      collectionId: "c1",
      itemId: "c1",
    };
    expect(getWatchTarget(ctx)).toEqual({ entityType: "collection", entityId: "c1" });
  });

  test("returns request target", () => {
    const ctx: CtxMenuState = {
      x: 0,
      y: 0,
      itemType: "request",
      collectionId: "c1",
      itemId: "r1",
    };
    expect(getWatchTarget(ctx)).toEqual({ entityType: "request", entityId: "r1" });
  });

  test("returns null for other types", () => {
    const ctx: CtxMenuState = {
      x: 0,
      y: 0,
      itemType: "folder",
      collectionId: "c1",
      itemId: "f1",
    };
    expect(getWatchTarget(ctx)).toBeNull();
  });

  test("returns null for request without itemId", () => {
    const ctx: CtxMenuState = {
      x: 0,
      y: 0,
      itemType: "request",
      collectionId: "c1",
      itemId: null,
    };
    expect(getWatchTarget(ctx)).toBeNull();
  });
});
