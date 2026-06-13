import { describe, expect, test } from "bun:test";

import { cleanClickedUrl } from "./cleanClickedUrl";
import { formatStatusText, getStatusClass } from "./responsePanelHeaderHelpers";

describe("response helpers", () => {
  test("cleans quoted clicked urls", () => {
    expect(cleanClickedUrl(`"https://api.example.com/users",`)).toBe(
      "https://api.example.com/users",
    );
  });

  test("formats response status metadata", () => {
    expect(getStatusClass(201)).toBe("success");
    expect(getStatusClass(302)).toBe("redirect");
    expect(getStatusClass(500)).toBe("error");
    expect(formatStatusText(200, "200 OK")).toBe("OK");
  });
});
