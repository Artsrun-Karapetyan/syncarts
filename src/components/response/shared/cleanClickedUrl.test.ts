import { describe, expect, test } from "bun:test";

import { cleanClickedUrl } from "./cleanClickedUrl";

describe("cleanClickedUrl", () => {
  test("cleans quoted clicked urls", () => {
    expect(cleanClickedUrl(`"https://api.example.com/users",`)).toBe(
      "https://api.example.com/users",
    );
  });
});
