import { describe, expect, test } from "bun:test";

import type { TabData } from "@/contexts/WorkspaceContext";
import { generateCurlCommand } from "@/utils/curlGenerator";

function request(overrides: Partial<TabData>): TabData {
  return {
    id: "tab",
    name: "Request",
    method: "GET",
    url: "https://api.example.com/users",
    headers: [],
    authType: "none",
    bodyType: "none",
    body: "",
    response: null,
    ...overrides,
  };
}

describe("generateCurlCommand", () => {
  test("generates a simple GET request", () => {
    expect(
      generateCurlCommand({
        collections: [],
        globalVariables: [],
        request: request({}),
      }),
    ).toBe("curl --location 'https://api.example.com/users'");
  });

  test("includes method, headers, and raw body", () => {
    expect(
      generateCurlCommand({
        collections: [],
        globalVariables: [],
        request: request({
          method: "POST",
          headers: [
            { key: "content-type", value: "application/json", enabled: true },
          ],
          bodyType: "raw",
          body: '{"name":"Ada"}',
        }),
      }),
    ).toBe(
      [
        "curl --location 'https://api.example.com/users'",
        "  --request POST",
        "  --header 'content-type: application/json'",
        `  --data-raw '{"name":"Ada"}'`,
      ].join(" \\\n"),
    );
  });

  test("interpolates environment and path variables", () => {
    expect(
      generateCurlCommand({
        activeEnvironment: {
          id: "env",
          name: "Dev",
          variables: [
            {
              id: "host",
              key: "host",
              value: "api.example.com",
              enabled: true,
            },
          ],
        },
        collections: [],
        globalVariables: [],
        request: request({
          url: "https://{{host}}/users/:id",
          pathVariables: [{ id: "id", key: "id", value: "John Doe" }],
        }),
      }),
    ).toBe("curl --location 'https://api.example.com/users/John%20Doe'");
  });
});
