import { describe, expect, mock, test } from "bun:test";

let patchCalled = false;
let patchPayload: any = null;

mock.module("@/lib/api", () => ({
  api: {
    patch: async (url: string, body: any) => {
      patchCalled = true;
      patchPayload = { url, body };
    },
  },
}));

import { useRequestEntitySave } from "./useRequestEntitySave";

describe("useRequestEntitySave", () => {
  const defaultArgs = (currentWorkspace: any, saveRequestSpy: any) => ({
    activeWorkspaceId: "w1",
    currentWorkspace,
    findSavedRequestById: () => ({
      collectionId: "col1",
      folderId: "folder1",
      request: { id: "req1", name: "Initial Req" } as any,
    }),
    rememberTabSnapshot: mock(),
    resolveTabSavedRequestId: () => "req1",
    saveRequest: saveRequestSpy,
  });

  test("returns null if resolveTabSavedRequestId returns falsy", () => {
    const actions = useRequestEntitySave({
      ...defaultArgs({}, mock()),
      resolveTabSavedRequestId: () => undefined,
    });
    expect(actions.saveSavedRequestTab({ id: "t1" } as any)).toBeNull();
  });

  test("returns null if findSavedRequestById returns falsy", () => {
    const actions = useRequestEntitySave({
      ...defaultArgs({}, mock()),
      findSavedRequestById: () => null,
    });
    expect(actions.saveSavedRequestTab({ id: "t1" } as any)).toBeNull();
  });

  test("saves request and triggers API sync if workspace owner is present", async () => {
    patchCalled = false;
    patchPayload = null;
    const saveRequestSpy = mock();
    const currentWorkspace = { ownerId: "u1" };

    const actions = useRequestEntitySave(
      defaultArgs(currentWorkspace, saveRequestSpy),
    );
    const result = actions.saveSavedRequestTab({
      id: "t1",
      name: "Tab Name",
      url: "http://api",
    } as any);

    expect(result).not.toBeNull();
    expect(saveRequestSpy).toHaveBeenCalled();
    expect(patchCalled).toBe(true);
    expect(patchPayload.url).toBe("/workspaces/w1/requests/req1");
  });
});
