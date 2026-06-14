import { describe, expect, test } from "bun:test";

import type { Folder, SavedRequest } from "../core/types";
import { findExample, findFolder } from "./tabTreeFinders";

const request = (id: string): SavedRequest => ({
  type: "request",
  id,
  name: id,
  method: "GET",
  url: `/${id}`,
  headers: [],
  body: "",
  examples: [
    {
      id: `${id}-example`,
      name: "Example",
      code: 200,
      status: "OK",
      body: "",
      headers: [],
    },
  ],
});

describe("tabTreeFinders", () => {
  test("finds nested folders and examples", () => {
    const items: (Folder | SavedRequest)[] = [
      {
        type: "folder",
        id: "folder",
        name: "Folder",
        items: [request("request")],
      },
    ];

    expect(findFolder(items, "folder")).toMatchObject({ id: "folder" });
    expect(findExample(items, "request-example")).toMatchObject({
      id: "request-example",
      name: "Example",
    });
  });

  test("returns null when folder or example is missing", () => {
    expect(findFolder([], "missing")).toBeNull();
    expect(findExample([], "missing")).toBeNull();
  });

  test("finds deeply nested folder", () => {
    const items = [
      {
        type: "folder",
        id: "f-1",
        name: "F1",
        items: [{ type: "folder", id: "f-2", name: "F2", items: [] }],
      },
    ] as Folder[];
    expect(findFolder(items, "f-2")?.id).toBe("f-2");
  });
});
