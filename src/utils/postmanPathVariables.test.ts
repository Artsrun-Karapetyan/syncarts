import { describe, expect, test } from "bun:test";

import {
  buildPostmanPathVariables,
  parsePostmanPathVariables,
} from "./postmanPathVariables";

describe("postmanPathVariables", () => {
  test("parsePostmanPathVariables merges variables from url object", () => {
    const rawUrl = "https://api.com/:id";
    const urlObj = {
      variable: [{ key: "id", value: "123", description: "The ID" }],
    };

    const vars = parsePostmanPathVariables(urlObj, rawUrl);
    expect(vars).toHaveLength(1);
    expect(vars[0].key).toBe("id");
    expect(vars[0].value).toBe("123");
    expect(vars[0].description).toBe("The ID");
  });

  test("parsePostmanPathVariables works without url variable array", () => {
    const rawUrl = "https://api.com/:id";
    const vars = parsePostmanPathVariables({}, rawUrl);
    expect(vars).toHaveLength(1);
    expect(vars[0].key).toBe("id");
    expect(vars[0].value).toBe("");
  });

  test("buildPostmanPathVariables builds correctly", () => {
    const built = buildPostmanPathVariables([
      { id: "1", key: "id", value: "123", description: "desc" },
    ]);
    expect(built).toHaveLength(1);
    expect(built?.[0].key).toBe("id");
    expect(built?.[0].value).toBe("123");
    expect(built?.[0].description).toBe("desc");

    expect(buildPostmanPathVariables([])).toBeUndefined();
  });
});
