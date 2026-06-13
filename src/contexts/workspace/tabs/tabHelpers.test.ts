import { describe, expect, it } from "bun:test";

import type { Collection, SavedRequest, TabData } from "../core/types";
import {
  buildSavedRequestFromTab,
  findSavedRequestByIdInCollections,
  requestSnapshot,
} from "./tabHelpers";

const savedRequest: SavedRequest = {
  type: "request",
  id: "request-1",
  name: "Get Users",
  method: "GET",
  url: "/users",
  headers: [],
  authType: "inherit",
  bodyType: "raw",
  body: "",
};

const collections: Collection[] = [
  {
    id: "collection-1",
    name: "API",
    items: [
      {
        type: "folder",
        id: "folder-1",
        name: "Users",
        items: [savedRequest],
      },
    ],
  },
];

describe("tabHelpers", () => {
  it("finds a saved request location in nested collections", () => {
    expect(findSavedRequestByIdInCollections(collections, "request-1")).toEqual(
      {
        collectionId: "collection-1",
        folderId: "folder-1",
        request: savedRequest,
      },
    );
  });

  it("returns null when no request id is provided", () => {
    expect(findSavedRequestByIdInCollections(collections)).toBeNull();
  });

  it("builds a saved request from a tab and keeps existing examples", () => {
    const tab = {
      name: "Create User",
      method: "POST",
      url: "/users",
      headers: [],
      authType: "inherit",
      bodyType: "json",
      body: "{}",
    } as TabData;

    expect(
      buildSavedRequestFromTab(tab, "request-2", {
        ...savedRequest,
        examples: [{ id: "example-1", name: "OK", status: 200 }],
      }),
    ).toMatchObject({
      type: "request",
      id: "request-2",
      name: "Create User",
      method: "POST",
      examples: [{ id: "example-1", name: "OK", status: 200 }],
    });
  });

  it("creates stable snapshots with defaults", () => {
    expect(requestSnapshot({ url: "/users" })).toBe(
      JSON.stringify({
        name: "",
        method: "GET",
        url: "/users",
        headers: [],
        authType: "inherit",
        bearerToken: "",
        bodyType: "raw",
        pathVariables: [],
        queryParamDescriptions: {},
        queryParams: [],
        formData: [],
        body: "",
        description: "",
        preRequestScript: "",
        testScript: "",
      }),
    );
  });
});
