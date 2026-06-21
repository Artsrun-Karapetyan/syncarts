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
                  example: "<xml></xml>"
                }
              }
            }
          }
        }
      }
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(item.body).toBe("<xml></xml>");
    expect(item.headers.find((h: any) => h.key === "Content-Type")?.value).toBe("text/xml");
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
                      $ref: "#/components/examples/MyExample"
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        examples: {
          MyExample: {
            value: { ref: "resolved" }
          }
        }
      }
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
                        items: { type: "string" }
                      },
                      num: { type: "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
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
                        items: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
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
                    $ref: "http://external.url/schema.json"
                  }
                }
              }
            }
          }
        }
      }
    });
    const result = parseOpenApiCollection(json);
    const item = result.items[0] as any;
    expect(item.body).toBe("");
  });
});
