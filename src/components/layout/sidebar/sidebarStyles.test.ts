import { describe, expect, test } from "bun:test";

import { SIDEBAR_ROOT_STYLE, SIDEBAR_SCROLL_STYLE } from "./sidebarStyles";

describe("sidebarStyles", () => {
  test("SIDEBAR_ROOT_STYLE is defined", () => {
    expect(SIDEBAR_ROOT_STYLE.width).toBe("100%");
  });

  test("SIDEBAR_SCROLL_STYLE is defined", () => {
    expect(SIDEBAR_SCROLL_STYLE.overflow).toBe("auto");
  });
});
