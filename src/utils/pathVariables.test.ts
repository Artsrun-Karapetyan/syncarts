import { describe, expect, test } from "bun:test";

import {
  applyPathVariables,
  extractPathVariableKeys,
  syncPathVariablesWithUrl,
  upsertPathVariable,
} from "./pathVariables";

describe("pathVariables", () => {
  test("extracts unique path variable keys from url path only", () => {
    expect(
      extractPathVariableKeys(
        "https://api.example.com/users/:userId/orders/:orderId?ignored=:nope",
      ),
    ).toEqual(["userId", "orderId"]);
  });

  test("syncs path variables while preserving existing values", () => {
    const synced = syncPathVariablesWithUrl("/users/:userId/posts/:postId", [
      {
        id: "existing",
        key: "userId",
        value: "42",
        description: "Current user",
      },
    ]);

    expect(synced).toHaveLength(2);
    expect(synced[0]).toEqual({
      id: "existing",
      key: "userId",
      value: "42",
      description: "Current user",
    });
    expect(synced[1].key).toBe("postId");
  });

  test("upserts and applies encoded path variable values", () => {
    const variables = upsertPathVariable([], "name", "John Doe");

    expect(applyPathVariables("/users/:name", variables)).toBe(
      "/users/John%20Doe",
    );
  });
});
