import { describe, expect, test } from "bun:test";

import { parseCurlCommand } from "@/utils/curlParser";

describe("parseCurlCommand", () => {
  test("returns null for non-curl input", () => {
    expect(parseCurlCommand("https://api.example.com")).toBeNull();
  });

  test("parses method, url, headers, and raw body", () => {
    const parsed = parseCurlCommand(
      `curl -X PATCH "https://api.example.com/users/42" -H "content-type: application/json" -H "x-token: abc" --data '{"name":"Ada"}'`,
    );

    expect(parsed?.method).toBe("PATCH");
    expect(parsed?.url).toBe("https://api.example.com/users/42");
    expect(parsed?.bodyType).toBe("raw");
    expect(parsed?.body).toBe('{"name":"Ada"}');
    expect(parsed?.headers).toEqual([
      { key: "content-type", value: "application/json", enabled: true },
      { key: "x-token", value: "abc", enabled: true },
    ]);
  });

  test("normalizes escaped bracket query params", () => {
    const parsed = parseCurlCommand(
      `curl "https://api.example.com/items?filter\\[name\\]=book"`,
    );

    expect(parsed?.url).toBe("https://api.example.com/items?filter[name]=book");
  });
});
