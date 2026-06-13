import { describe, expect, it } from "bun:test";

import { ensureTrailingBlank, parseParamsFromUrl } from "./paramsEditorHelpers";

describe("paramsEditorHelpers edge cases", () => {
  it("keeps an existing trailing blank row", () => {
    const params = [
      {
        key: "page",
        value: "1",
        description: "",
        enabled: true,
      },
      {
        key: "",
        value: "",
        description: "",
        enabled: true,
      },
    ];

    expect(ensureTrailingBlank(params)).toBe(params);
  });

  it("returns one blank param when the url has no query string", () => {
    expect(parseParamsFromUrl("/users", {})).toEqual([
      {
        key: "",
        value: "",
        description: "",
        enabled: true,
      },
    ]);
  });

  it("does not drop invalid encoded query values", () => {
    expect(parseParamsFromUrl("/users?bad=%E0%A4%A", {})).toEqual([
      {
        key: "bad",
        value: "%E0%A4%A",
        description: "",
        enabled: true,
      },
    ]);
  });
});
