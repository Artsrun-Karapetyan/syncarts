import { describe, expect, test } from "bun:test";

import { parseCurlCommand } from "./curlParser";

describe("parseCurlCommand extra cases", () => {
  test("parses user agent, cookie, and basic auth flags", () => {
    const parsed = parseCurlCommand(
      "curl -A SyncArts -b a=b -u user:pass https://api.test",
    );

    expect(parsed?.headers).toEqual([
      { key: "User-Agent", value: "SyncArts" },
      { key: "Cookie", value: "a=b" },
      { key: "Authorization", value: `Basic ${btoa("user:pass")}` },
    ]);
  });
});
