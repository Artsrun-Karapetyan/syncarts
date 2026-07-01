import { describe, expect, mock, test } from "bun:test";

const mockInvoke = mock();
mock.module("@tauri-apps/api/core", () => ({ invoke: mockInvoke }));

import type { Workspace } from "@/contexts/workspace/core/types";

import {
  readWorkspaceFromLocalFs,
  writeWorkspaceToLocalFs,
} from "./localFsSyncHelpers";

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "ws-1",
    name: "My WS",
    type: "local",
    path: "/my/path",
    collections: [],
    environments: [],
    globalVariables: [],
    ...overrides,
  };
}

describe("writeWorkspaceToLocalFs", () => {
  test("no-op when workspace has no path", async () => {
    const ws = makeWorkspace({ path: undefined });
    await writeWorkspaceToLocalFs(ws);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test("no-op when workspace type is not local", async () => {
    mockInvoke.mockReset();
    const ws = makeWorkspace({ type: "cloud" });
    await writeWorkspaceToLocalFs(ws);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test("writes syncarts.json for a local workspace", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue(undefined);
    const ws = makeWorkspace();
    await writeWorkspaceToLocalFs(ws);

    const calls = mockInvoke.mock.calls;
    const syncartsCall = calls.find(
      (c: any[]) => c[1]?.relativePath === ".syncarts/syncarts.json",
    );
    expect(syncartsCall).toBeDefined();
    const content = JSON.parse(syncartsCall![1].content);
    // id is intentionally omitted — localStorage id is the source of truth
    expect(content.id).toBeUndefined();
    expect(content.name).toBe("My WS");
  });

  test("writes environment files", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue(undefined);
    const ws = makeWorkspace({
      environments: [
        {
          id: "env-1",
          name: "Dev",
          variables: [],
        },
      ],
    });
    await writeWorkspaceToLocalFs(ws);

    const calls = mockInvoke.mock.calls;
    const envCall = calls.find((c: any[]) =>
      c[1]?.relativePath?.includes(".syncarts/environments/"),
    );
    expect(envCall).toBeDefined();
    expect(envCall![1].relativePath).toContain("Dev.env.json");
  });

  test("writes collection files", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue(undefined);
    const ws = makeWorkspace({
      collections: [
        {
          id: "col-1",
          name: "My Collection",
          items: [],
        },
      ],
    });
    await writeWorkspaceToLocalFs(ws);

    const calls = mockInvoke.mock.calls;
    const colCall = calls.find((c: any[]) =>
      c[1]?.relativePath?.includes("collections/My Collection/collection.json"),
    );
    expect(colCall).toBeDefined();
    const content = JSON.parse(colCall![1].content);
    expect(content.id).toBe("col-1");
  });

  test("writes folder and request files recursively", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue(undefined);
    const ws = makeWorkspace({
      collections: [
        {
          id: "col-1",
          name: "Test Col",
          items: [
            {
              type: "folder",
              id: "f-1",
              name: "A Folder",
              items: [
                {
                  type: "request",
                  id: "r-1",
                  name: "A Request",
                  method: "GET",
                  url: "http://x.com",
                  headers: [],
                  body: "",
                },
              ],
            },
          ],
        },
      ],
    });
    await writeWorkspaceToLocalFs(ws);

    const calls = mockInvoke.mock.calls;
    const folderCall = calls.find((c: any[]) =>
      c[1]?.relativePath?.includes("folder.json"),
    );
    expect(folderCall).toBeDefined();
    expect(folderCall![1].relativePath).toContain(
      "collections/Test Col/A Folder/folder.json",
    );

    const requestCall = calls.find((c: any[]) =>
      c[1]?.relativePath?.includes(".req.json"),
    );
    expect(requestCall).toBeDefined();
    expect(requestCall![1].relativePath).toContain(
      "collections/Test Col/A Folder/A Request.req.json",
    );
  });

  test("sanitizes collection names with trailing dots/spaces into valid paths", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue(undefined);
    const ws = makeWorkspace({
      collections: [{ id: "col-1", name: "API v1. ", items: [] }],
    });
    await writeWorkspaceToLocalFs(ws);

    const colCall = mockInvoke.mock.calls.find((c: any[]) =>
      c[1]?.relativePath?.endsWith("collection.json"),
    );
    expect(colCall).toBeDefined();
    // no trailing "." or " " before the path separator — that segment is unwritable
    // on some filesystems and is exactly what broke import on Linux
    expect(colCall![1].relativePath).toContain("collections/API v1/");
    expect(colCall![1].relativePath).not.toContain(". /");
  });

  test("handles invoke errors gracefully", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockRejectedValue(new Error("disk full"));
    const ws = makeWorkspace();

    // Should not throw
    await expect(writeWorkspaceToLocalFs(ws)).resolves.toBeUndefined();
  });
});

describe("readWorkspaceFromLocalFs", () => {
  test("returns null when invoke returns empty array", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue([]);
    const result = await readWorkspaceFromLocalFs("/some/path");
    expect(result).toBeNull();
  });

  test("returns fallback workspace when no syncarts.json found", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue([
      { relative_path: "other.json", content: "{}" },
    ]);
    const result = await readWorkspaceFromLocalFs("/some/path");
    // id is intentionally absent — the caller stamps in the localStorage id
    expect(result).toMatchObject({
      name: "path",
      type: "local",
      path: "/some/path",
      environments: [],
      collections: [],
    });
  });

  test("parses workspace from syncarts.json", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue([
      {
        relative_path: ".syncarts/syncarts.json",
        content: JSON.stringify({ name: "WS", type: "local" }),
      },
    ]);
    const result = await readWorkspaceFromLocalFs("/my/path");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("WS");
    expect(result!.path).toBe("/my/path");
    expect(result!.collections).toEqual([]);
    expect(result!.environments).toEqual([]);
  });

  test("loads environments from env files", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue([
      {
        relative_path: ".syncarts/syncarts.json",
        content: JSON.stringify({ name: "WS" }),
      },
      {
        relative_path: ".syncarts/environments/dev_env-1.env.json",
        content: JSON.stringify({ id: "env-1", name: "Dev", variables: [] }),
      },
    ]);
    const result = await readWorkspaceFromLocalFs("/path");
    expect(result!.environments).toHaveLength(1);
    expect(result!.environments![0].id).toBe("env-1");
  });

  test("loads collections and their requests", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue([
      {
        relative_path: ".syncarts/syncarts.json",
        content: JSON.stringify({ name: "WS" }),
      },
      {
        relative_path: ".syncarts/collections/my_col_col-1/collection.json",
        content: JSON.stringify({ id: "col-1", name: "Col" }),
      },
      {
        relative_path: ".syncarts/collections/my_col_col-1/my_req_r-1.req.json",
        content: JSON.stringify({
          type: "request",
          id: "r-1",
          name: "Req",
          method: "GET",
          url: "",
          headers: [],
          body: "",
        }),
      },
    ]);
    const result = await readWorkspaceFromLocalFs("/path");
    expect(result!.collections).toHaveLength(1);
    expect(result!.collections[0].id).toBe("col-1");
    expect(result!.collections[0].items).toHaveLength(1);
    expect((result!.collections[0].items[0] as any).id).toBe("r-1");
  });

  test("loads nested folders inside collections", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue([
      {
        relative_path: ".syncarts/syncarts.json",
        content: JSON.stringify({ name: "WS" }),
      },
      {
        relative_path: ".syncarts/collections/col_col-1/collection.json",
        content: JSON.stringify({ id: "col-1", name: "Col" }),
      },
      {
        relative_path: ".syncarts/collections/col_col-1/folder_f-1/folder.json",
        content: JSON.stringify({ id: "f-1", name: "Folder" }),
      },
    ]);
    const result = await readWorkspaceFromLocalFs("/path");
    expect(result!.collections[0].items).toHaveLength(1);
    expect((result!.collections[0].items[0] as any).type).toBe("folder");
    expect((result!.collections[0].items[0] as any).id).toBe("f-1");
  });

  test("returns null on invoke error", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockRejectedValue(new Error("not found"));
    const result = await readWorkspaceFromLocalFs("/bad/path");
    expect(result).toBeNull();
  });
});
