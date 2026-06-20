import { describe, expect, test } from "bun:test";

import {
  exportToPostmanCollection,
  importPostmanCollection,
  importPostmanEnvironment,
} from "@/utils/postmanParser";

describe("importPostmanEnvironment", () => {
  test("imports enabled Postman environment variables", () => {
    const environment = importPostmanEnvironment(
      JSON.stringify({
        name: "Local",
        values: [
          { key: "baseUrl", value: "https://api.test", enabled: true },
          { key: "disabled", value: "secret", enabled: false },
          { key: "", value: "ignored" },
        ],
      }),
    );

    expect(environment.name).toBe("Local");
    expect(environment.variables).toHaveLength(2);
    expect(environment.variables[0]).toMatchObject({
      key: "baseUrl",
      value: "https://api.test",
      enabled: true,
    });
    expect(environment.variables[1]).toMatchObject({
      key: "disabled",
      enabled: false,
    });
  });

  test("throws for invalid environment payloads", () => {
    expect(() =>
      importPostmanEnvironment(JSON.stringify({ name: "Broken" })),
    ).toThrow("Invalid Postman Environment format");
  });

  test("wrappers call underlying parsers", () => {
    // Very basic test just to hit the wrapper functions
    expect(() => importPostmanCollection("{}")).toThrow();

    const colStr = exportToPostmanCollection({
      id: "1",
      name: "C",
      items: [],
      collections: [],
      variables: [],
      environments: [],
    } as any);
    expect(colStr).toContain("C");
  });
});
