import { describe, expect, test } from "bun:test";

import type { SavedExample } from "@/contexts/workspace/core/types";
import { createExampleTabData } from "@/contexts/workspace/tabs/examples/exampleTabData";

describe("createExampleTabData", () => {
  test("restores the full original request snapshot", () => {
    const example: SavedExample = {
      id: "example-1",
      name: "Created",
      code: 201,
      status: "Created",
      body: '{"id":1}',
      headers: [{ key: "Content-Type", value: "application/json" }],
      originalRequest: {
        method: "POST",
        url: "https://api.example.com/users?page=1",
        headers: [{ key: "X-Trace", value: "abc", description: "Trace id" }],
        authType: "bearer",
        bearerToken: "token",
        bodyType: "raw",
        description: "Create user request",
        pathVariables: [
          { id: "path-1", key: "id", value: "42", description: "User id" },
        ],
        queryParams: [
          {
            key: "page",
            value: "1",
            enabled: true,
            description: "Page number",
          },
        ],
        queryParamDescriptions: { page: "Page number" },
        preRequestScript: "console.log('pre')",
        testScript: "pm.test('ok', () => {})",
        body: '{"name":"Jane"}',
      },
    };

    const tab = createExampleTabData("collection-1", example);

    expect(tab).toMatchObject({
      type: "example",
      name: "Created",
      collectionId: "collection-1",
      exampleId: "example-1",
      method: "POST",
      url: "https://api.example.com/users?page=1",
      authType: "bearer",
      bearerToken: "token",
      bodyType: "raw",
      description: "Create user request",
      queryParamDescriptions: { page: "Page number" },
      preRequestScript: "console.log('pre')",
      testScript: "pm.test('ok', () => {})",
    });
    expect(tab.queryParams?.[0]).toMatchObject({
      key: "page",
      description: "Page number",
    });
    expect(tab.pathVariables?.[0]).toMatchObject({
      key: "id",
      description: "User id",
    });
    expect(tab.headers?.[0]).toMatchObject({
      key: "X-Trace",
      description: "Trace id",
    });
  });
});
