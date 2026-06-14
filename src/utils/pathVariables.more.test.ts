import { describe, expect, test } from "bun:test";

import {
  applyPathVariables,
  extractPathVariableKeys,
  syncPathVariablesWithUrl,
  upsertPathVariable,
} from "./pathVariables";

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

  test("syncPathVariablesWithUrl retains existing and adds new variables", () => {
    const existing = [
      { id: "1", key: "user", value: "admin", description: "User ID" },
    ];
    const synced = syncPathVariablesWithUrl(
      "https://api.com/:user/posts/:post",
      existing,
    );

    expect(synced).toHaveLength(2);
    expect(synced[0].key).toBe("user");
    expect(synced[0].value).toBe("admin");
    expect(synced[0].description).toBe("User ID");

    expect(synced[1].key).toBe("post");
    expect(synced[1].value).toBe("");
  });

  test("upsertPathVariable adds new variable when not found", () => {
    const vars = upsertPathVariable(undefined, "user", "admin", "User ID");
    expect(vars).toHaveLength(1);
    expect(vars[0].key).toBe("user");
    expect(vars[0].value).toBe("admin");
    expect(vars[0].description).toBe("User ID");
  });

  test("upsertPathVariable updates existing variable", () => {
    const existing = [
      { id: "1", key: "user", value: "old", description: "old desc" },
    ];
    const vars = upsertPathVariable(existing, "user", "new");
    expect(vars).toHaveLength(1);
    expect(vars[0].value).toBe("new");
    expect(vars[0].description).toBe("old desc");

    const varsWithDesc = upsertPathVariable(
      existing,
      "user",
      "new",
      "new desc",
    );
    expect(varsWithDesc[0].description).toBe("new desc");
  });
});
