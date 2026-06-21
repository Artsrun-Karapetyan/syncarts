import { describe, expect, test } from "bun:test";
import { parsePostmanPathVariables, buildPostmanPathVariables } from "./postmanPathVariables";

describe("postmanPathVariables extra cases", () => {
  test("parsePostmanPathVariables handles missing url variable array", () => {
    const result = parsePostmanPathVariables({}, "https://api.com/:id");
    expect(result.length).toBe(1);
    expect(result[0].key).toBe("id");
  });

  test("buildPostmanPathVariables handles empty array", () => {
    const result = buildPostmanPathVariables([]);
    expect(result).toBeUndefined();
  });
});
