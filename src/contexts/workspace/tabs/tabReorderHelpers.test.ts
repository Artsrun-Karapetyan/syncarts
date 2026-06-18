import { describe, expect, test } from "bun:test";

import type { TabData } from "../core/types";
import { reorderTabs } from "./tabReorderHelpers";

const tab = (id: string) => ({ id, name: id }) as TabData;

describe("reorderTabs", () => {
  test("moves a tab before another tab", () => {
    expect(
      reorderTabs([tab("a"), tab("b"), tab("c")], "c", "a", "before").map(
        (item) => item.id,
      ),
    ).toEqual(["c", "a", "b"]);
  });

  test("moves a tab after another tab", () => {
    expect(
      reorderTabs([tab("a"), tab("b"), tab("c")], "a", "c", "after").map(
        (item) => item.id,
      ),
    ).toEqual(["b", "c", "a"]);
  });

  test("keeps tabs unchanged for invalid moves", () => {
    const tabs = [tab("a"), tab("b")];

    expect(reorderTabs(tabs, "a", "a", "before")).toBe(tabs);
    expect(reorderTabs(tabs, "missing", "a", "before")).toBe(tabs);
    expect(reorderTabs(tabs, "a", "missing", "before")).toBe(tabs);
  });
});
