import { describe, expect, test } from "bun:test";

import type { Folder, SavedRequest } from "../../contexts/WorkspaceContext";
import { parseOpenApiCollection } from "./openApiImportParser";

describe("parseOpenApiCollection", () => {
  test("imports OpenAPI paths as requests grouped by tag", () => {
    const collection = parseOpenApiCollection(
      JSON.stringify({
        openapi: "3.0.3",
        info: {
          title: "Demo Shop API",
          description: "Demo docs",
          version: "1.0.0",
        },
        servers: [{ url: "https://api.example.com/" }],
        paths: {
          "/users": {
            get: {
              tags: ["Users"],
              summary: "List users",
              parameters: [
                {
                  name: "page",
                  in: "query",
                  schema: { type: "integer", example: 1 },
                },
              ],
              responses: {
                "200": {
                  description: "OK",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          users: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: { id: { type: "string" } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            post: {
              tags: ["Users"],
              summary: "Create user",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "John" },
                        active: { type: "boolean" },
                      },
                    },
                  },
                },
              },
              responses: {
                "201": {
                  description: "Created",
                  content: {
                    "application/json": {
                      example: { id: "user-1", name: "John" },
                    },
                  },
                },
              },
            },
          },
          "/users/{id}": {
            get: {
              summary: "Get user by id",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  description: "User id",
                  schema: { type: "string", example: "123" },
                },
              ],
              responses: { "204": { description: "No content" } },
            },
          },
        },
      }),
    );

    expect(collection.name).toBe("Demo Shop API");
    expect(collection.description).toBe("Demo docs");
    expect(collection.variables?.[0]).toMatchObject({
      key: "base_url",
      value: "https://api.example.com",
    });

    const rootRequest = collection.items[0] as SavedRequest;
    expect(rootRequest).toMatchObject({
      type: "request",
      name: "Get user by id",
      method: "GET",
      url: "{{base_url}}/users/:id",
    });
    expect(rootRequest.pathVariables?.[0]).toMatchObject({
      key: "id",
      value: "123",
      description: "User id",
    });

    const usersFolder = collection.items[1] as Folder;
    expect(usersFolder).toMatchObject({ type: "folder", name: "Users" });
    expect(usersFolder.items).toHaveLength(2);

    const listUsers = usersFolder.items[0] as SavedRequest;
    expect(listUsers.url).toBe("{{base_url}}/users?page=1");
    expect(listUsers.queryParams?.[0]).toMatchObject({
      key: "page",
      value: "1",
    });
    expect(listUsers.examples?.[0]).toMatchObject({
      code: 200,
      status: "OK",
    });

    const createUser = usersFolder.items[1] as SavedRequest;
    expect(createUser.headers[0]).toMatchObject({
      key: "Content-Type",
      value: "application/json",
    });
    expect(JSON.parse(createUser.body)).toEqual({
      name: "John",
      active: false,
    });
    expect(createUser.examples?.[0].body).toContain("user-1");
  });

  test("rejects non OpenAPI documents", () => {
    expect(() =>
      parseOpenApiCollection(JSON.stringify({ info: { name: "Postman" } })),
    ).toThrow("Invalid OpenAPI format");
  });
});
