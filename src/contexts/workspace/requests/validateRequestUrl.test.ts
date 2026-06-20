import { describe, expect, test } from "bun:test";

import { validateRequestUrl } from "@/contexts/workspace/requests/validateRequestUrl";

describe("validateRequestUrl", () => {
  test("accepts http and https urls", () => {
    expect(validateRequestUrl("https://example.com")).toBeNull();
    expect(validateRequestUrl("http://localhost:4000/api")).toBeNull();
  });

  test("rejects empty, unresolved, relative, and unsupported urls", () => {
    expect(validateRequestUrl("")).toBe("Request URL is empty.");
    expect(validateRequestUrl("{{url}}/api")).toContain("Unresolved variable");
    expect(validateRequestUrl("/api/users")).toContain("Invalid request URL");
    expect(validateRequestUrl("ftp://example.com")).toBe(
      "Request URL must start with http:// or https://.",
    );
  });
});
