import { describe, expect, test, mock } from "bun:test";
import { createWorkspaceEventSource, replaceRealtimeRequest } from "./workspaceRealtimeHelpers";
import * as api from "@/lib/api";

describe("workspaceRealtimeHelpers extra cases", () => {
  test("createWorkspaceEventSource returns null if no token", () => {
    mock.module("@/lib/api", () => ({ getToken: () => null, API_URL: "http://api" }));
    const result = createWorkspaceEventSource("w1");
    expect(result).toBeNull();
  });

  test("replaceRealtimeRequest rejects mismatching folderId", () => {
    const workspaces = [
      {
        id: "w1",
        collections: [
          {
            id: "c1",
            items: [
              { type: "folder", id: "f1", items: [{ type: "request", id: "r1" }] }
            ]
          }
        ]
      }
    ] as any[];

    // the request in store is in f1, but the payload says it has no folderId (undefined vs f1)
    const res1 = replaceRealtimeRequest(workspaces, "w1", { id: "r1", collectionId: "c1", folderId: "f2" } as any, {} as any);
    expect(res1.changed).toBe(false);

    const res2 = replaceRealtimeRequest(workspaces, "w1", { id: "r1", collectionId: "c1", folderId: undefined } as any, {} as any);
    expect(res2.changed).toBe(true);
  });
});
