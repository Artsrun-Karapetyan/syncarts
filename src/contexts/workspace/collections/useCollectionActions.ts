import type {
  Collection,
  Folder,
  SavedRequest,
  TabData,
  Workspace,
} from "../core/types";
import {
  addRequestToFolder,
  filterItemFromItems,
  hasRequestInTarget,
  removeRequestFromItems,
  renameItemInItems,
  sortItemsByTarget,
  updateRequestInItems,
} from "./collectionItemHelpers";

interface CollectionActionsArgs {
  activeWorkspaceId: string;
  localDefaultWorkspaceId: string;
  setTabsByWorkspace: (
    value:
      | Record<string, TabData[]>
      | ((prev: Record<string, TabData[]>) => Record<string, TabData[]>),
  ) => void;
  updateWorkspaces: (updater: (prev: Workspace[]) => Workspace[]) => void;
}

export function useCollectionActions(args: CollectionActionsArgs) {
  const {
    activeWorkspaceId,
    localDefaultWorkspaceId,
    setTabsByWorkspace,
    updateWorkspaces,
  } = args;

  const addCollection = (name: string) => {
    updateWorkspaces((prev) =>
      prev.map((ws) => {
        if (ws.id !== activeWorkspaceId) return ws;
        return {
          ...ws,
          collections: [
            ...ws.collections,
            { id: crypto.randomUUID(), name, items: [] },
          ],
        };
      }),
    );
  };

  const forkCollection = (collectionId: string) => {
    updateWorkspaces((prev) => {
      const activeWorkspace = prev.find((ws) => ws.id === activeWorkspaceId);
      const collectionToFork = activeWorkspace?.collections.find(
        (c) => c.id === collectionId,
      );

      if (!collectionToFork) return prev;

      const forkedCollection: Collection = {
        ...collectionToFork,
        id: crypto.randomUUID(),
        name: `${collectionToFork.name} (Fork)`,
        fork: {
          originalWorkspaceId: activeWorkspaceId,
          originalCollectionId: collectionToFork.id,
          forkedAt: Date.now(),
        },
      };

      return prev.map((ws) => {
        if (ws.id === localDefaultWorkspaceId) {
          return { ...ws, collections: [...ws.collections, forkedCollection] };
        }
        return ws;
      });
    });
  };

  const updateCollection = (id: string, data: Partial<Collection>) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          return {
            ...w,
            collections: w.collections.map((c) =>
              c.id === id ? { ...c, ...data } : c,
            ),
          };
        }
        return w;
      }),
    );
  };

  const importCollection = (collectionData: Omit<Collection, "id">) => {
    updateWorkspaces((prev) =>
      prev.map((ws) => {
        if (ws.id !== activeWorkspaceId) return ws;
        return {
          ...ws,
          collections: [
            ...ws.collections,
            { ...collectionData, id: crypto.randomUUID() },
          ],
        };
      }),
    );
  };

  const deleteCollection = (id: string) => {
    updateWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? { ...w, collections: w.collections.filter((c) => c.id !== id) }
          : w,
      ),
    );
  };

  const addFolder = (
    collectionId: string,
    parentFolderId: string | null,
    name: string,
  ) => {
    const newFolder: Folder = {
      type: "folder",
      id: crypto.randomUUID(),
      name,
      items: [],
    };
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;

        const updatedCollections = w.collections.map((col) => {
          if (col.id !== collectionId) return col;
          if (!parentFolderId)
            return { ...col, items: [...col.items, newFolder] };

          const recursivelyAddFolder = (
            items: (Folder | SavedRequest)[],
          ): (Folder | SavedRequest)[] => {
            return items.map((item) => {
              if (item.type === "folder") {
                if (item.id === parentFolderId)
                  return { ...item, items: [...item.items, newFolder] };
                return { ...item, items: recursivelyAddFolder(item.items) };
              }
              return item;
            });
          };

          return { ...col, items: recursivelyAddFolder(col.items) };
        });
        return { ...w, collections: updatedCollections };
      }),
    );
  };

  const updateFolder = (
    collectionId: string,
    folderId: string,
    data: Partial<Folder>,
  ) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        return {
          ...w,
          collections: w.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const updateItem = (
              items: (Folder | SavedRequest)[],
            ): (Folder | SavedRequest)[] => {
              return items.map((item) => {
                if (item.type === "folder" && item.id === folderId)
                  return { ...item, ...data } as Folder;
                if (item.type === "folder")
                  return { ...item, items: updateItem(item.items) };
                return item;
              });
            };
            return { ...c, items: updateItem(c.items) };
          }),
        };
      }),
    );
  };

  const saveRequest = (
    collectionId: string,
    folderId: string | null,
    request: SavedRequest,
  ) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        const targetCol = w.collections.find((c) => c.id === collectionId);
        const foundInTargetLocation = targetCol
          ? hasRequestInTarget(targetCol.items, folderId, request.id)
          : false;

        if (foundInTargetLocation) {
          return {
            ...w,
            collections: w.collections.map((col) =>
              col.id === collectionId
                ? { ...col, items: updateRequestInItems(col.items, request) }
                : col,
            ),
          };
        }

        let newCollections = w.collections.map((col) => ({
          ...col,
          items: removeRequestFromItems(col.items, request.id),
        }));
        newCollections = newCollections.map((col) => {
          if (col.id !== collectionId) return col;
          if (!folderId) return { ...col, items: [...col.items, request] };
          return {
            ...col,
            items: addRequestToFolder(col.items, folderId, request),
          };
        });

        return { ...w, collections: newCollections };
      }),
    );
  };

  const deleteItem = (collectionId: string, itemId: string) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        return {
          ...w,
          collections: w.collections.map((col) =>
            col.id === collectionId
              ? { ...col, items: filterItemFromItems(col.items, itemId) }
              : col,
          ),
        };
      }),
    );
  };

  const renameItem = (
    collectionId: string,
    itemId: string,
    newName: string,
  ) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        return {
          ...w,
          collections: w.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  name: col.id === itemId ? newName : col.name,
                  items: renameItemInItems(col.items, itemId, newName),
                }
              : col,
          ),
        };
      }),
    );

    setTabsByWorkspace((prev) => {
      const wsTabs = prev[activeWorkspaceId] || [];
      const newTabs = wsTabs.map((t) => {
        if (
          t.collectionId === collectionId &&
          (t.id === itemId ||
            t.folderId === itemId ||
            t.exampleId === itemId ||
            t.savedRequestId === itemId)
        ) {
          return { ...t, name: newName };
        }
        return t;
      });
      return { ...prev, [activeWorkspaceId]: newTabs };
    });
  };

  const sortItems = (
    collectionId: string,
    folderId: string | null,
    type: "default" | "az",
  ) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        return {
          ...w,
          collections: w.collections.map((col) =>
            col.id === collectionId
              ? { ...col, items: sortItemsByTarget(col.items, folderId, type) }
              : col,
          ),
        };
      }),
    );
  };

  return {
    addCollection,
    forkCollection,
    updateCollection,
    importCollection,
    deleteCollection,
    addFolder,
    updateFolder,
    saveRequest,
    deleteItem,
    renameItem,
    sortItems,
  };
}
