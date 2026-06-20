import { describe, expect, test } from "bun:test";

import type { Collection } from "@/contexts/WorkspaceContext";
import { stringifyPostmanCollection } from "@/utils/postman/postmanExportParser";

describe("stringifyPostmanCollection", () => {
  test("exports request url parts, auth, headers, body, and path variables", () => {
    const collection: Collection = {
      id: "collection",
      name: "API",
      items: [
        {
          type: "request",
          id: "request",
          name: "Create user",
          method: "POST",
          url: "https://api.test/users/:id?active=true",
          headers: [{ key: "Content-Type", value: "application/json" }],
          authType: "bearer",
          bearerToken: "token",
          bodyType: "raw",
          body: '{"name":"Ann"}',
          pathVariables: [
            { id: "path", key: "id", value: "42", description: "User id" },
          ],
          response: null,
        },
      ],
    };

    const exported = JSON.parse(stringifyPostmanCollection(collection));
    const request = exported.item[0].request;

    expect(exported.info.name).toBe("API");
    expect(request.auth.type).toBe("bearer");
    expect(request.header[0].key).toBe("Content-Type");
    expect(request.body.raw).toBe('{"name":"Ann"}');
    expect(request.url.host).toEqual(["api", "test"]);
    expect(request.url.variable[0]).toMatchObject({
      key: "id",
      value: "42",
    });
  });
});
