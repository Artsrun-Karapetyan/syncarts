import { describe, expect, test } from "bun:test";

import { formatStatusText, getStatusClass } from "./responsePanelHeaderHelpers";

describe("responsePanelHeaderHelpers", () => {
  test("formats response status metadata", () => {
    expect(getStatusClass(201)).toBe("success");
    expect(getStatusClass(302)).toBe("redirect");
    expect(getStatusClass(500)).toBe("error");
    expect(formatStatusText(200, "200 OK")).toBe("OK");
  });
});
