import { describe, expect, test } from "bun:test";

import {
  formatStatusText,
  getStatusClass,
} from "@/components/response/header/responsePanelHeaderHelpers";

describe("responsePanelHeaderHelpers extra cases", () => {
  test("removes duplicated numeric prefix from status text", () => {
    expect(formatStatusText(404, "404 Not Found")).toBe("Not Found");
    expect(formatStatusText(200, "OK")).toBe("OK");
  });

  test("classifies redirect and error statuses", () => {
    expect(getStatusClass(302)).toBe("redirect");
    expect(getStatusClass(500)).toBe("error");
  });
});
