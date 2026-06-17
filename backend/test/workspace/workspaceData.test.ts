import { describe, expect, test } from "bun:test";

import {
  readWorkspaceData,
  replaceWorkspaceData,
} from "../../src/workspace/workspaceData.js";

describe("workspaceData normalized persistence", () => {
  test("replaceWorkspaceData writes nested collections, requests, examples, and variables", async () => {
    const writes = createWriteCaptures();

    await replaceWorkspaceData(writes.client, "workspace", {
      collections: [
        {
          id: "collection",
          name: "API",
          items: [
            {
              type: "folder",
              id: "folder",
              name: "Users",
              items: [
                {
                  type: "request",
                  id: "request",
                  name: "List Users",
                  method: "GET",
                  url: "/users",
                  headers: [{ key: "Accept", value: "application/json" }],
                  body: "",
                  examples: [
                    {
                      id: "example",
                      name: "OK",
                      code: 200,
                      status: "OK",
                      body: "{}",
                      headers: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      environments: [
        {
          id: "env",
          name: "Dev",
          variables: [{ id: "env-var", key: "host", value: "localhost" }],
        },
      ],
      globalVariables: [{ id: "global", key: "token", value: "abc" }],
    });

    expect(writes.collections[0]).toMatchObject({
      id: "collection",
      workspaceId: "workspace",
      name: "API",
    });
    expect(writes.folders[0]).toMatchObject({
      id: "folder",
      collectionId: "collection",
      parentFolderId: null,
    });
    expect(writes.requests[0]).toMatchObject({
      id: "request",
      collectionId: "collection",
      folderId: "folder",
      method: "GET",
    });
    expect(writes.examples[0]).toMatchObject({
      id: "example",
      requestId: "request",
      code: 200,
    });
    expect(writes.environments[0].variables.create[0]).toMatchObject({
      id: "env-var",
      key: "host",
    });
    expect(writes.globalVariables[0]).toMatchObject({
      id: "global",
      workspaceId: "workspace",
    });
  });

  test("readWorkspaceData rebuilds nested workspace payload shape", async () => {
    const data = await readWorkspaceData(
      {
        workspaceCollection: {
          findMany: async () => [
            {
              id: "collection",
              name: "API",
              sortOrder: 0,
              folders: [
                {
                  id: "folder",
                  name: "Users",
                  parentFolderId: null,
                  sortOrder: 0,
                },
              ],
              requests: [
                {
                  id: "request",
                  name: "List Users",
                  method: "GET",
                  url: "/users",
                  headers: [{ key: "Accept", value: "application/json" }],
                  body: "",
                  folderId: "folder",
                  sortOrder: 0,
                  examples: [
                    {
                      id: "example",
                      name: "OK",
                      code: 200,
                      status: "OK",
                      body: "{}",
                      headers: [],
                      sortOrder: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
        workspaceEnvironment: {
          findMany: async () => [
            {
              id: "env",
              name: "Dev",
              variables: [
                {
                  id: "env-var",
                  key: "host",
                  value: "localhost",
                  enabled: true,
                },
              ],
            },
          ],
        },
        workspaceGlobalVariable: {
          findMany: async () => [
            { id: "global", key: "token", value: "abc", enabled: true },
          ],
        },
      } as any,
      "workspace",
    );

    expect(data.collections[0].items[0]).toMatchObject({
      id: "folder",
      type: "folder",
      items: [{ id: "request", type: "request" }],
    });
    expect(data.collections[0].items[0].items[0].examples[0]).toMatchObject({
      id: "example",
      code: 200,
    });
    expect(data.environments[0].variables[0]).toMatchObject({
      id: "env-var",
      key: "host",
    });
    expect(data.globalVariables[0]).toMatchObject({
      id: "global",
      value: "abc",
    });
  });
});

function createWriteCaptures() {
  const writes = {
    collections: [] as any[],
    folders: [] as any[],
    requests: [] as any[],
    examples: [] as any[],
    environments: [] as any[],
    globalVariables: [] as any[],
  };

  return {
    ...writes,
    client: {
      workspaceCollection: createDelegate(writes.collections),
      workspaceFolder: createDelegate(writes.folders),
      workspaceRequest: createDelegate(writes.requests),
      requestExample: createDelegate(writes.examples),
      workspaceEnvironment: createDelegate(writes.environments),
      workspaceGlobalVariable: createDelegate(writes.globalVariables),
    },
  };
}

function createDelegate(target: any[]) {
  return {
    deleteMany: async () => ({ count: 0 }),
    create: async ({ data }: any) => {
      target.push(data);
      return data;
    },
  };
}
