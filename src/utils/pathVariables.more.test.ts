import { describe, expect, test } from "bun:test";

import { applyPathVariables, extractPathVariableKeys } from "./pathVariables";

describe("pathVariables extra cases", () => {
  test("ignores query-string colon values and leaves missing values untouched", () => {
    expect(extractPathVariableKeys("/users/:id?filter=:ignored")).toEqual([
      "id",
    ]);
    expect(
      applyPathVariables("/users/:id/posts/:postId", [
        { id: "id", key: "id", value: "John Doe" },
      ]),
    ).toBe("/users/John%20Doe/posts/:postId");
  });
});
