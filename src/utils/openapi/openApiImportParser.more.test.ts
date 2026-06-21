import { describe, expect, test } from "bun:test";

import { parseOpenApiCollection } from "./openApiImportParser";

describe("openApiImportParser extra cases", () => {
  test("handles unknown content type fallback", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          post: {
            requestBody: {
              content: {
                "text/xml": {
                  example: "<xml></xml>",
                },
              },
            },
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(item.body).toBe("<xml></xml>");
    expect(item.headers.find((h: any) => h.key === "Content-Type")?.value).toBe(
      "text/xml",
    );
  });

  test("resolves references for examples", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  examples: {
                    testRef: {
                      $ref: "#/components/examples/MyExample",
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        examples: {
          MyExample: {
            value: { ref: "resolved" },
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(item.body).toContain('"ref": "resolved"');
  });

  test("resolves schema types array and object with nested properties", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      list: {
                        type: "array",
                        items: { type: "string" },
                      },
                      num: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    const bodyObj = JSON.parse(item.body);
    expect(bodyObj.list).toEqual([""]);
    expect(bodyObj.num).toBe(0);
  });

  test("resolves implicit object and array schemas without explicit type", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      list: {
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    const bodyObj = JSON.parse(item.body);
    expect(bodyObj.list).toEqual([""]);
  });

  test("handles invalid references safely", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "http://external.url/schema.json",
                  },
                },
              },
            },
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(item.body).toBe("");
  });

  test("resolves servers URL with trailing slash or without servers", () => {
    const jsonNoServers = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: { "/api": { get: {} } },
    });
    const res1 = parseOpenApiCollection(jsonNoServers);
    expect(res1.variables).toBeUndefined();

    const jsonWithSlash = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      servers: [{ url: "https://api.example.com/" }],
      paths: { "/api": { get: {} } },
    });
    const res2 = parseOpenApiCollection(jsonWithSlash);
    expect(res2.variables?.[0].value).toBe("https://api.example.com");
  });

  test("handles deprecated parameters by marking them disabled", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          get: {
            parameters: [
              {
                name: "old_param",
                in: "query",
                deprecated: true,
                schema: { type: "string" },
              },
              {
                name: "X-Deprecated-Header",
                in: "header",
                deprecated: true,
                schema: { type: "string" },
              },
            ],
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(
      item.queryParams.find((p: any) => p.key === "old_param")?.enabled,
    ).toBe(false);
    expect(
      item.headers.find((h: any) => h.key === "X-Deprecated-Header")?.enabled,
    ).toBe(false);
  });

  test("uses schema defaults and enum values for schema examples", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["pending", "active"] },
                      count: { type: "integer", default: 10 },
                      flag: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    const body = JSON.parse(item.body);
    expect(body.status).toBe("pending");
    expect(body.count).toBe(10);
    expect(body.flag).toBe(false);
  });

  test("parses multiple path variables from paths", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users/{userId}/posts/{postId}": {
          get: {
            parameters: [
              {
                name: "userId",
                in: "path",
                schema: { type: "string", example: "u1" },
              },
              {
                name: "postId",
                in: "path",
                schema: { type: "string", example: "p2" },
              },
            ],
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(item.url).toBe("/users/:userId/posts/:postId");
    expect(item.pathVariables).toHaveLength(2);
    expect(
      item.pathVariables.find((pv: any) => pv.key === "userId")?.value,
    ).toBe("u1");
    expect(
      item.pathVariables.find((pv: any) => pv.key === "postId")?.value,
    ).toBe("p2");
  });

  test("merges path-level parameters with operation-level parameters", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/api": {
          parameters: [
            {
              name: "path-param",
              in: "query",
              schema: { type: "string", example: "path-val" },
            },
          ],
          get: {
            parameters: [
              {
                name: "op-param",
                in: "query",
                schema: { type: "string", example: "op-val" },
              },
            ],
          },
        },
      },
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(item.queryParams).toHaveLength(2);
    expect(
      item.queryParams.find((p: any) => p.key === "path-param")?.value,
    ).toBe("path-val");
    expect(item.queryParams.find((p: any) => p.key === "op-param")?.value).toBe(
      "op-val",
    );
  });
});
