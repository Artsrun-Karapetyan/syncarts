import { describe, expect, test } from "bun:test";

import { parsePostmanCollection } from "./postmanImportParser";

describe("postmanImportParser extra cases 2", () => {
  test("handles object url with raw string", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      item: [
        {
          name: "Req",
          request: {
            url: { raw: "https://api.com" },
          },
        },
      ],
    });
    const result = parsePostmanCollection(json);
    const req = result.items[0] as any;
    expect(req.url).toBe("https://api.com");
  });

  test("handles raw body fallback when mode is undefined", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      item: [
        {
          name: "Req",
          request: {
            url: "https://api.com",
            body: {
              raw: "fallback_raw",
            },
          },
        },
      ],
    });
    const result = parsePostmanCollection(json);
    const req = result.items[0] as any;
    expect(req.body).toBe("fallback_raw");
  });
});
