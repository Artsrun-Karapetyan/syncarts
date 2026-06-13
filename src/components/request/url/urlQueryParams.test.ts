import { describe, expect, test } from "bun:test";

import { parseQueryParamsFromUrl } from "./urlQueryParams";

describe("parseQueryParamsFromUrl", () => {
  test("parses query params and keeps descriptions", () => {
    expect(
      parseQueryParamsFromUrl("https://api.test/search?q=hello+world&page=2", {
        q: "Search term",
      }),
    ).toEqual([
      {
        key: "q",
        value: "hello world",
        description: "Search term",
        enabled: true,
      },
      { key: "page", value: "2", description: "", enabled: true },
    ]);
  });
});
