import { describe, expect, test } from "bun:test";

import { parsePostmanCollection } from "./postmanImportParser";

describe("parsePostmanCollection", () => {
  test("parses request metadata, query params, scripts, and examples", () => {
    const collection = parsePostmanCollection(
      JSON.stringify({
        info: { name: "API", description: "Demo collection" },
        event: [
          { listen: "prerequest", script: { exec: ["const token = 1;"] } },
          { listen: "test", script: { exec: ["pm.test('ok', () => {});"] } },
        ],
        item: [
          {
            name: "Get user",
            request: {
              method: "GET",
              url: {
                raw: "https://api.test/users/:id?active=true",
                query: [{ key: "active", value: "true" }],
                variable: [{ key: "id", value: "42" }],
              },
              header: [{ key: "Accept", value: "application/json" }],
            },
            response: [{ name: "OK", code: 200, status: "OK", body: "{}" }],
          },
        ],
      }),
    );

    const request = collection.items[0];

    expect(collection.name).toBe("API");
    expect(collection.preRequestScript).toBe("const token = 1;");
    expect(collection.testScript).toBe("pm.test('ok', () => {});");
    expect(request.type).toBe("request");
    if (request.type !== "request") throw new Error("Expected request");
    expect(request.queryParams?.[0].key).toBe("active");
    expect(request.pathVariables?.[0]).toMatchObject({
      key: "id",
      value: "42",
    });
    expect(request.examples?.[0]).toMatchObject({ name: "OK", code: 200 });
  });
});
