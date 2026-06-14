import { describe, expect, test } from "bun:test";

import { extractBearerToken } from "../../src/auth/authToken.js";

describe("extractBearerToken", () => {
  test("extracts and trims bearer token", () => {
    expect(extractBearerToken("Bearer abc123 ")).toBe("abc123");
  });

  test("returns empty string for missing or non-bearer headers", () => {
    expect(extractBearerToken(undefined)).toBe("");
    expect(extractBearerToken("Basic abc123")).toBe("");
  });
});
