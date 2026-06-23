import { describe, expect, test } from "bun:test";

import type { TabData } from "@/contexts/workspace/core/types";
import {
  sortPinnedTabs,
  toggleTabPinned,
} from "@/contexts/workspace/tabs/helpers/tabPinHelpers";

describe("tabPinHelpers", () => {
  test("sorts pinned tabs before regular tabs", () => {
    expect(
      sortPinnedTabs([tab("a"), tab("b", true), tab("c")]).map(
        (item) => item.id,
      ),
    ).toEqual(["b", "a", "c"]);
  });

  test("toggles pin state and keeps pinned tabs first", () => {
    const nextTabs = toggleTabPinned([tab("a"), tab("b")], "b");

    expect(nextTabs.map((item) => item.id)).toEqual(["b", "a"]);
    expect(nextTabs[0].pinned).toBe(true);
  });
});

function tab(id: string, pinned = false): TabData {
  return {
    id,
    pinned,
    name: id,
    method: "GET",
    url: "",
    headers: [],
    body: "",
    response: null,
  };
}
