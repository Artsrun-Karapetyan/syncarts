import { describe, expect, mock, test } from "bun:test";

const mockInvoke = mock(() => Promise.resolve([]));
mock.module("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

import type { Workspace } from "@/contexts/workspace/core/types";

import {
  readWorkspaceFromLocalFs,
  writeWorkspaceToLocalFs,
} from "./localFsSyncHelpers";

describe("localFsSyncHelpers", () => {
  test("writeWorkspaceToLocalFs invokes write_local_file for all elements", async () => {
    const workspace: Workspace = {
      id: "ws-1",
      name: "Local WS",
      type: "local",
      path: "/mock/path",
      globalVariables: [{ id: "v1", key: "g1", value: "val1", enabled: true }],
      environments: [{ id: "env-1", name: "Dev", variables: [] }],
      collections: [
        {
          id: "col-1",
          name: "My Collection",
          variables: [],
          items: [
            {
              type: "folder",
              id: "f-1",
              name: "Folder 1",
              variables: [],
              items: [
                {
                  type: "request",
                  id: "req-1",
                  name: "Request 1",
                  method: "GET",
                  url: "http://test",
                  headers: [],
                  queryParams: [],
                  body: "",
                },
              ],
            },
          ],
        },
      ],
    };

    mockInvoke.mockClear();
    await writeWorkspaceToLocalFs(workspace);

    // Should invoke write_local_file multiple times:
    // 1. syncarts.json
    // 2. Dev environment
    // 3. Collection json
    // 4. Folder json
    // 5. Request json
    expect(mockInvoke).toHaveBeenCalled();
    expect((mockInvoke.mock.calls as any).length).toBe(5);
    expect((mockInvoke.mock.calls as any)[0][0]).toBe("write_local_file");
  });

  test("readWorkspaceFromLocalFs parses file structure into Workspace object", async () => {
    const mockFiles = [
      {
        relative_path: "syncarts.json",
        content: JSON.stringify({
          id: "ws-1",
          name: "Local WS",
          type: "local",
          globalVariables: [],
        }),
      },
      {
        relative_path: "environments/dev_env-1.env.json",
        content: JSON.stringify({ id: "env-1", name: "Dev", variables: [] }),
      },
      {
        relative_path: "collections/my_collection_col-1/collection.json",
        content: JSON.stringify({
          id: "col-1",
          name: "My Collection",
          variables: [],
        }),
      },
      {
        relative_path:
          "collections/my_collection_col-1/folder_1_f-1/folder.json",
        content: JSON.stringify({ id: "f-1", name: "Folder 1", variables: [] }),
      },
      {
        relative_path:
          "collections/my_collection_col-1/folder_1_f-1/request_1_req-1.req.json",
        content: JSON.stringify({
          id: "req-1",
          name: "Request 1",
          method: "GET",
          url: "http://test",
          headers: [],
        }),
      },
    ];

    mockInvoke.mockResolvedValueOnce(mockFiles as any);

    const ws = await readWorkspaceFromLocalFs("/mock/path");

    expect(ws).not.toBeNull();
    expect(ws?.id).toBe("ws-1");
    expect(ws?.environments?.length).toBe(1);
    expect(ws?.collections?.length).toBe(1);
    expect(ws?.collections?.[0].items?.length).toBe(1);
    expect(ws?.collections?.[0].items?.[0].type).toBe("folder");
    expect((ws?.collections?.[0].items?.[0] as any).items?.[0].id).toBe(
      "req-1",
    );
  });
});
