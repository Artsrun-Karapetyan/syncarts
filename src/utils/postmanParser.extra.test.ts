import { describe, expect, test } from "bun:test";
import { importOpenApiCollection } from "./postmanParser";

describe("postmanParser extra cases", () => {
  test("importOpenApiCollection calls openapi parser", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test OpenApi", version: "1" },
      paths: {}
    });
    const result = importOpenApiCollection(json);
    expect(result.name).toBe("Test OpenApi");
  });
});
