import { describe, expect, test } from "bun:test";

import { moveSidebarEntityInWorkspace } from "@/contexts/workspace/collections/collectionMoveHelpers";
import type { Workspace } from "@/contexts/workspace/core/types";

const example = (id: string) => ({
  id,
  name: id,
  code: 200,
  status: "OK",
  body: "",
  headers: [],
});

const request = (id: string) => ({
  type: "request" as const,
  id,
  name: id,
  method: "GET",
  url: "",
  headers: [],
  body: "",
});

const requestWithExamples = (id: string, exampleIds: string[]) => ({
  ...request(id),
  examples: exampleIds.map(example),
});

const workspace = (): Workspace => ({
  id: "workspace",
  name: "Workspace",
  collections: [
    {
      id: "collection-a",
      name: "A",
      items: [
        request("request-a"),
        {
          type: "folder",
          id: "folder-a",
          name: "Folder A",
          items: [request("nested-a")],
        },
      ],
    },
    {
      id: "collection-b",
      name: "B",
      items: [request("request-b")],
    },
  ],
});

describe("moveSidebarEntityInWorkspace", () => {
  test("reorders collections", () => {
    const result = moveSidebarEntityInWorkspace(
      workspace(),
      { type: "collection", collectionId: "collection-b" },
      { type: "collection", collectionId: "collection-a", position: "before" },
    );

    expect(result.collections.map((collection) => collection.id)).toEqual([
      "collection-b",
      "collection-a",
    ]);
  });

  test("moves a request into a folder in another collection", () => {
    const result = moveSidebarEntityInWorkspace(
      workspace(),
      {
        type: "request",
        collectionId: "collection-b",
        itemId: "request-b",
      },
      {
        type: "folder",
        collectionId: "collection-a",
        itemId: "folder-a",
        position: "inside",
      },
    );

    const targetFolder = result.collections[0].items[1];
    expect(targetFolder.type).toBe("folder");
    if (targetFolder.type === "folder") {
      expect(targetFolder.items.map((item) => item.id)).toEqual([
        "nested-a",
        "request-b",
      ]);
    }
    expect(result.collections[1].items).toEqual([]);
  });

  test("moves a folder after a request", () => {
    const result = moveSidebarEntityInWorkspace(
      workspace(),
      {
        type: "folder",
        collectionId: "collection-a",
        itemId: "folder-a",
      },
      {
        type: "request",
        collectionId: "collection-b",
        itemId: "request-b",
        position: "after",
      },
    );

    expect(result.collections[0].items.map((item) => item.id)).toEqual([
      "request-a",
    ]);
    expect(result.collections[1].items.map((item) => item.id)).toEqual([
      "request-b",
      "folder-a",
    ]);
  });

  test("rejects moving a folder inside its own child", () => {
    const original = workspace();
    const result = moveSidebarEntityInWorkspace(
      original,
      {
        type: "folder",
        collectionId: "collection-a",
        itemId: "folder-a",
      },
      {
        type: "request",
        collectionId: "collection-a",
        itemId: "nested-a",
        position: "after",
      },
    );

    expect(result).toBe(original);
  });

  test("moves an example into another request", () => {
    const original = workspace();
    original.collections[0].items[0] = requestWithExamples("request-a", [
      "example-a",
    ]);
    original.collections[1].items[0] = requestWithExamples("request-b", []);

    const result = moveSidebarEntityInWorkspace(
      original,
      {
        type: "example",
        collectionId: "collection-a",
        itemId: "example-a",
        requestId: "request-a",
      },
      {
        type: "request",
        collectionId: "collection-b",
        itemId: "request-b",
        position: "inside",
      },
    );

    const sourceRequest = result.collections[0].items[0];
    const targetRequest = result.collections[1].items[0];
    expect(sourceRequest.type).toBe("request");
    expect(targetRequest.type).toBe("request");
    if (sourceRequest.type === "request" && targetRequest.type === "request") {
      expect(sourceRequest.examples).toEqual([]);
      expect(targetRequest.examples?.map((item) => item.id)).toEqual([
        "example-a",
      ]);
    }
  });

  test("reorders examples inside a request", () => {
    const original = workspace();
    original.collections[0].items[0] = requestWithExamples("request-a", [
      "example-a",
      "example-b",
      "example-c",
    ]);

    const result = moveSidebarEntityInWorkspace(
      original,
      {
        type: "example",
        collectionId: "collection-a",
        itemId: "example-c",
        requestId: "request-a",
      },
      {
        type: "example",
        collectionId: "collection-a",
        itemId: "example-a",
        requestId: "request-a",
        position: "before",
      },
    );

    const targetRequest = result.collections[0].items[0];
    expect(targetRequest.type).toBe("request");
    if (targetRequest.type === "request") {
      expect(targetRequest.examples?.map((item) => item.id)).toEqual([
        "example-c",
        "example-a",
        "example-b",
      ]);
    }
  });
});
