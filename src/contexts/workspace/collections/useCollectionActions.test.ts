import { describe, expect, mock, test } from "bun:test";

let pullForkCalled = false;
mock.module("@/contexts/workspace/collections/collectionPullHelpers", () => ({
  pullForkCollection: async () => {
    pullForkCalled = true;
  },
}));

import { useCollectionActions } from "./useCollectionActions";

describe("useCollectionActions", () => {
  const defaultWorkspace = {
    id: "w-active",
    name: "Active Workspace",
    collections: [
      { id: "c1", name: "Collection 1", items: [] },
      { id: "c2", name: "Collection 2", items: [] },
    ],
  };

  const getArgs = (updateWorkspaces: any) => ({
    activeWorkspaceId: "w-active",
    localDefaultWorkspaceId: "w-default",
    workspaces: [defaultWorkspace] as any[],
    setTabsByWorkspace: mock(),
    updateWorkspaces,
    updateWorkspacesLocal: mock(),
  });

  test("addCollection appends new collection to active workspace", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );
    actions.addCollection("New Col");

    const result = updater([defaultWorkspace]);
    expect(result[0].collections).toHaveLength(3);
    expect(result[0].collections[2].name).toBe("New Col");
  });

  test("forkCollection duplicates collection into default workspace with fork metadata", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );
    actions.forkCollection("c1");

    const defaultWorkspaceState = { id: "w-default", collections: [] } as any;
    const result = updater([defaultWorkspace, defaultWorkspaceState]);
    const targetWs = result.find((ws: any) => ws.id === "w-default");
    expect(targetWs.collections).toHaveLength(1);
    expect(targetWs.collections[0].fork).toBeDefined();
    expect(targetWs.collections[0].fork.originalCollectionId).toBe("c1");
  });

  test("pullCollection calls pullForkCollection helper", async () => {
    pullForkCalled = false;
    const actions = useCollectionActions(getArgs(() => {}));
    await actions.pullCollection("c1");
    expect(pullForkCalled).toBe(true);
  });

  test("updateCollection updates partial collection details", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );
    actions.updateCollection("c1", { name: "Updated Title" });

    const result = updater([defaultWorkspace]);
    expect(result[0].collections[0].name).toBe("Updated Title");
  });

  test("importCollection adds imported collection", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );
    actions.importCollection({ name: "Imported", items: [] } as any);

    const result = updater([defaultWorkspace]);
    expect(result[0].collections).toHaveLength(3);
    expect(result[0].collections[2].name).toBe("Imported");
  });

  test("deleteCollection removes collection by id", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );
    actions.deleteCollection("c1");

    const result = updater([defaultWorkspace]);
    expect(result[0].collections).toHaveLength(1);
    expect(result[0].collections[0].id).toBe("c2");
  });

  test("addFolder adds folder at collection root or under parent folder", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    // Add folder at root level
    actions.addFolder("c1", null, "New Folder");
    let result = updater([defaultWorkspace]);
    expect(result[0].collections[0].items).toHaveLength(1);
    expect(result[0].collections[0].items[0].name).toBe("New Folder");

    // Add folder nested
    const stateWithFolder = {
      ...defaultWorkspace,
      collections: [
        {
          id: "c1",
          items: [{ type: "folder", id: "f1", items: [] }],
        },
      ],
    } as any;
    actions.addFolder("c1", "f1", "Nested Folder");
    result = updater([stateWithFolder]);
    expect(result[0].collections[0].items[0].items).toHaveLength(1);
    expect(result[0].collections[0].items[0].items[0].name).toBe(
      "Nested Folder",
    );
  });

  test("updateFolder modifies folder properties nested or root", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    const state = {
      ...defaultWorkspace,
      collections: [
        {
          id: "c1",
          items: [{ type: "folder", id: "f1", name: "Old Name", items: [] }],
        },
      ],
    } as any;

    actions.updateFolder("c1", "f1", { name: "New Name" });
    const result = updater([state]);
    expect(result[0].collections[0].items[0].name).toBe("New Name");
  });

  test("deleteItem removes requests/folders from collection", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    const state = {
      ...defaultWorkspace,
      collections: [
        {
          id: "c1",
          items: [{ type: "request", id: "r1" }],
        },
      ],
    } as any;

    actions.deleteItem("c1", "r1");
    const result = updater([state]);
    expect(result[0].collections[0].items).toHaveLength(0);
  });

  test("renameItem renames items and updates tabs", () => {
    let updater: any = null;
    const setTabsByWorkspace = mock();
    const actions = useCollectionActions({
      ...getArgs((u: any) => {
        updater = u;
      }),
      setTabsByWorkspace,
    });

    const state = {
      ...defaultWorkspace,
      collections: [
        {
          id: "c1",
          name: "Old Name",
          items: [],
        },
      ],
    } as any;

    actions.renameItem("c1", "c1", "New Name");
    const result = updater([state]);
    expect(result[0].collections[0].name).toBe("New Name");
    expect(setTabsByWorkspace).toHaveBeenCalled();
  });

  test("sortItems sorts collection items", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    const state = {
      ...defaultWorkspace,
      collections: [
        {
          id: "c1",
          items: [
            { type: "request", id: "r2", name: "B" },
            { type: "request", id: "r1", name: "A" },
          ],
        },
      ],
    } as any;

    actions.sortItems("c1", null, "az");
    const result = updater([state]);
    expect(result[0].collections[0].items[0].name).toBe("A");
  });

  test("duplicateCollection copies collection with items", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    actions.duplicateCollection("c1");
    const result = updater([defaultWorkspace]);
    expect(result[0].collections).toHaveLength(3);
    expect(result[0].collections[1].name).toBe("Collection 1 Copy");
  });

  test("duplicateItem duplicates item inside collection", () => {
    let updater: any = null;
    const actions = useCollectionActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    const state = {
      ...defaultWorkspace,
      collections: [
        {
          id: "c1",
          items: [{ type: "request", id: "r1", name: "Req" }],
        },
      ],
    } as any;

    actions.duplicateItem("c1", "r1");
    const result = updater([state]);
    expect(result[0].collections[0].items).toHaveLength(2);
    expect(result[0].collections[0].items[1].name).toBe("Req Copy");
  });
});
