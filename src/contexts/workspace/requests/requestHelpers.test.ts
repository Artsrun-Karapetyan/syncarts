import { describe, expect, test } from "bun:test";

import type { Collection, TabData } from "../core/types";
import {
  getRequestAncestors,
  interpolateVariables,
  resolveRequestAuth,
} from "./requestHelpers";

function tab(overrides: Partial<TabData>): TabData {
  return {
    id: "tab",
    name: "Request",
    method: "GET",
    url: "",
    headers: [],
    authType: "inherit",
    body: "",
    response: null,
    ...overrides,
  };
}

const collections: Collection[] = [
  {
    id: "collection",
    name: "Collection",
    authType: "bearer",
    bearerToken: "collection-token",
    variables: [
      {
        id: "collection-host",
        key: "host",
        value: "collection.test",
        enabled: true,
      },
      {
        id: "collection-token",
        key: "token",
        value: "collection-token",
        enabled: true,
      },
    ],
    items: [
      {
        type: "folder",
        id: "folder",
        name: "Folder",
        authType: "bearer",
        bearerToken: "folder-token",
        variables: [
          {
            id: "folder-host",
            key: "host",
            value: "folder.test",
            enabled: true,
          },
          {
            id: "folder-base",
            key: "base",
            value: "https://{{host}}",
            enabled: true,
          },
        ],
        items: [
          {
            type: "request",
            id: "request",
            name: "Saved",
            method: "GET",
            url: "{{base}}/users",
            headers: [],
            body: "",
          },
        ],
      },
    ],
  },
];

describe("requestHelpers", () => {
  test("returns collection and folder ancestors for a saved request tab", () => {
    const ancestors = getRequestAncestors(
      tab({ collectionId: "collection", folderId: "folder" }),
      collections,
    );

    expect(ancestors.map((ancestor) => ancestor.id)).toEqual([
      "collection",
      "folder",
    ]);
  });

  test("inherits auth from nearest folder before collection", () => {
    expect(
      resolveRequestAuth(
        tab({ collectionId: "collection", folderId: "folder" }),
        collections,
      ),
    ).toMatchObject({
      authType: "bearer",
      bearerToken: "folder-token",
      inheritedFrom: { id: "folder" },
    });
  });

  test("keeps request auth when auth is not inherited", () => {
    expect(
      resolveRequestAuth(
        tab({
          authType: "bearer",
          bearerToken: "request-token",
          collectionId: "collection",
          folderId: "folder",
        }),
        collections,
      ),
    ).toMatchObject({
      authType: "bearer",
      bearerToken: "request-token",
      inheritedFrom: null,
    });
  });

  test("interpolates variables by environment, folder, collection, globals priority", () => {
    expect(
      interpolateVariables({
        activeEnvironment: {
          id: "env",
          name: "Dev",
          variables: [
            { id: "env-host", key: "host", value: "env.test", enabled: true },
          ],
        },
        activeTab: tab({ collectionId: "collection", folderId: "folder" }),
        collections,
        globalVariables: [
          {
            id: "global-host",
            key: "host",
            value: "global.test",
            enabled: true,
          },
        ],
        text: "{{base}}/{{token}}/{{host}}",
      }),
    ).toBe("https://env.test/collection-token/env.test");
  });

  test("leaves unknown variables unchanged", () => {
    expect(
      interpolateVariables({
        activeEnvironment: undefined,
        activeTab: tab({ collectionId: "collection" }),
        collections,
        globalVariables: [],
        text: "https://{{missing}}",
      }),
    ).toBe("https://{{missing}}");
  });

  test("resolves request ancestors with deeply nested folders", () => {
    const deepCollections: Collection[] = [
      {
        id: "c-1",
        name: "C",
        items: [
          {
            type: "folder",
            id: "f-1",
            name: "F1",
            items: [
              {
                type: "folder",
                id: "f-2",
                name: "F2",
                items: [],
              },
            ],
          },
        ],
      },
    ];

    const ancestors = getRequestAncestors(
      tab({ collectionId: "c-1", folderId: "f-2" }),
      deepCollections,
    );
    expect(ancestors.map((a) => a.id)).toEqual(["c-1", "f-1", "f-2"]);

    const missingAncestors = getRequestAncestors(
      tab({ collectionId: "c-1", folderId: "missing" }),
      deepCollections,
    );
    expect(missingAncestors.map((a) => a.id)).toEqual(["c-1"]);
  });
});
