import { describe, expect, it } from "bun:test";

import {
  createEmptyParam,
  ensureTrailingBlank,
  parseParamsFromUrl,
} from "./paramsEditorHelpers";

describe("paramsEditorHelpers", () => {
  it("creates an enabled empty param", () => {
    expect(createEmptyParam()).toEqual({
      key: "",
      value: "",
      description: "",
      enabled: true,
    });
  });

  it("adds a trailing blank param when the last row has content", () => {
    const params = [
      {
        key: "token",
        value: "abc",
        description: "",
        enabled: true,
      },
    ];

    expect(ensureTrailingBlank(params)).toEqual([
      params[0],
      {
        key: "",
        value: "",
        description: "",
        enabled: true,
      },
    ]);
  });

  it("parses query params and keeps saved descriptions", () => {
    expect(
      parseParamsFromUrl("/users?name=Ann+Lee&active=true", {
        name: "User name",
      }),
    ).toEqual([
      {
        key: "name",
        value: "Ann Lee",
        description: "User name",
        enabled: true,
      },
      {
        key: "active",
        value: "true",
        description: "",
        enabled: true,
      },
    ]);
  });
});
