import { describe, expect, test } from "bun:test";

import { parseQueryParamsFromUrl } from "./urlQueryParams";

describe("parseQueryParamsFromUrl extra cases", () => {
  test("keeps values containing equals and skips empty pairs", () => {
    expect(
      parseQueryParamsFromUrl("/search?token=a=b=c&&q=hello+world", {}),
    ).toEqual([
      { key: "token", value: "a=b=c", description: "", enabled: true },
      { key: "q", value: "hello world", description: "", enabled: true },
    ]);
  });
});
