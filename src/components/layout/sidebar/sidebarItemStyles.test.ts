import { describe, expect, test } from "bun:test";

import { itemRowStyle, toggleStyle } from "./sidebarItemStyles";

describe("sidebarItemStyles", () => {
  describe("itemRowStyle", () => {
    test("returns styles for highlighted item", () => {
      const style = itemRowStyle(true);
      expect(style.color).toBe("var(--text-primary)");
      expect(style.background).toBe("var(--bg-tertiary)");
      expect(style.boxShadow).toBe("inset 0 0 0 1px var(--accent-primary)");
    });

    test("returns styles for unhighlighted item", () => {
      const style = itemRowStyle(false);
      expect(style.color).toBe("var(--text-secondary)");
      expect(style.background).toBe("transparent");
      expect(style.boxShadow).toBe("none");
    });
  });

  describe("toggleStyle", () => {
    test("returns styles with given cursor", () => {
      const style = toggleStyle("pointer");
      expect(style.cursor).toBe("pointer");
    });
  });
});
