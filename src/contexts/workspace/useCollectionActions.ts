import type { Collection, Folder, SavedExample, SavedRequest, TabData, Workspace } from './types';

interface CollectionActionsArgs {
  activeTab: TabData | undefined;
  activeWorkspaceId: string;
  setTabsByWorkspace: (value: Record<string, TabData[]> | ((prev: Record<string, TabData[]>) => Record<string, TabData[]>)) => void;
  updateWorkspaces: (updater: (prev: Workspace[]) => Workspace[]) => void;
}

export function useCollectionActions(args: CollectionActionsArgs) {
  const { activeTab, activeWorkspaceId, setTabsByWorkspace, updateWorkspaces } = args;

  const addCollection = (name: string) => {
    updateWorkspaces(prev => prev.map(ws => {
      if (ws.id !== activeWorkspaceId) return ws;
      return { ...ws, collections: [...ws.collections, { id: crypto.randomUUID(), name, items: [] }] };
    }));
  };

  const updateCollection = (id: string, data: Partial<Collection>) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, collections: w.collections.map(c => c.id === id ? { ...c, ...data } : c) };
      }
      return w;
    }));
  };

  const importCollection = (collectionData: Omit<Collection, 'id'>) => {
    updateWorkspaces(prev => prev.map(ws => {
      if (ws.id !== activeWorkspaceId) return ws;
      return { ...ws, collections: [...ws.collections, { ...collectionData, id: crypto.randomUUID() }] };
    }));
  };

  const deleteCollection = (id: string) => {
    updateWorkspaces(prev => prev.map(w =>
      w.id === activeWorkspaceId ? { ...w, collections: w.collections.filter(c => c.id !== id) } : w
    ));
  };

  const addFolder = (collectionId: string, parentFolderId: string | null, name: string) => {
    const newFolder: Folder = { type: 'folder', id: crypto.randomUUID(), name, items: [] };
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;

      const updatedCollections = w.collections.map(col => {
        if (col.id !== collectionId) return col;
        if (!parentFolderId) return { ...col, items: [...col.items, newFolder] };

        const recursivelyAddFolder = (items: (Folder | SavedRequest)[]): (Folder | SavedRequest)[] => {
          return items.map(item => {
            if (item.type === 'folder') {
              if (item.id === parentFolderId) return { ...item, items: [...item.items, newFolder] };
              return { ...item, items: recursivelyAddFolder(item.items) };
            }
            return item;
          });
        };

        return { ...col, items: recursivelyAddFolder(col.items) };
      });
      return { ...w, collections: updatedCollections };
    }));
  };

  const updateFolder = (collectionId: string, folderId: string, data: Partial<Folder>) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        collections: w.collections.map(c => {
          if (c.id !== collectionId) return c;
          const updateItem = (items: (Folder | SavedRequest)[]): (Folder | SavedRequest)[] => {
            return items.map(item => {
              if (item.type === 'folder' && item.id === folderId) return { ...item, ...data } as Folder;
              if (item.type === 'folder') return { ...item, items: updateItem(item.items) };
              return item;
            });
          };
          return { ...c, items: updateItem(c.items) };
        })
      };
    }));
  };

  const saveRequest = (collectionId: string, folderId: string | null, request: SavedRequest) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      const targetCol = w.collections.find(c => c.id === collectionId);
      const foundInTargetLocation = targetCol ? hasRequestInTarget(targetCol.items, folderId, request.id) : false;

      if (foundInTargetLocation) {
        return {
          ...w,
          collections: w.collections.map(col =>
            col.id === collectionId ? { ...col, items: updateRequestInItems(col.items, request) } : col
          )
        };
      }

      let newCollections = w.collections.map(col => ({ ...col, items: removeRequestFromItems(col.items, request.id) }));
      newCollections = newCollections.map(col => {
        if (col.id !== collectionId) return col;
        if (!folderId) return { ...col, items: [...col.items, request] };
        return { ...col, items: addRequestToFolder(col.items, folderId, request) };
      });

      return { ...w, collections: newCollections };
    }));
  };

  const deleteItem = (collectionId: string, itemId: string) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        collections: w.collections.map(col =>
          col.id === collectionId ? { ...col, items: filterItemFromItems(col.items, itemId) } : col
        )
      };
    }));
  };

  const renameItem = (collectionId: string, itemId: string, newName: string) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        collections: w.collections.map(col =>
          col.id === collectionId
            ? { ...col, name: col.id === itemId ? newName : col.name, items: renameItemInItems(col.items, itemId, newName) }
            : col
        )
      };
    }));

    setTabsByWorkspace(prev => {
      const wsTabs = prev[activeWorkspaceId] || [];
      const newTabs = wsTabs.map(t => {
        if (t.collectionId === collectionId && (t.id === itemId || t.folderId === itemId || t.exampleId === itemId || t.savedRequestId === itemId)) {
          return { ...t, name: newName };
        }
        return t;
      });
      return { ...prev, [activeWorkspaceId]: newTabs };
    });
  };

  const addExample = (collectionId: string, requestId: string, exampleName: string) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        collections: w.collections.map(col =>
          col.id === collectionId ? { ...col, items: addExampleToItems(col.items, requestId, exampleName, activeTab) } : col
        )
      };
    }));
  };

  const deleteExample = (collectionId: string, requestId: string, exampleId: string) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        collections: w.collections.map(col =>
          col.id === collectionId ? { ...col, items: deleteExampleFromItems(col.items, requestId, exampleId) } : col
        )
      };
    }));
  };

  const sortItems = (collectionId: string, folderId: string | null, type: 'default' | 'az') => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        collections: w.collections.map(col =>
          col.id === collectionId ? { ...col, items: sortItemsByTarget(col.items, folderId, type) } : col
        )
      };
    }));
  };

  return {
    addCollection,
    updateCollection,
    importCollection,
    deleteCollection,
    addFolder,
    updateFolder,
    saveRequest,
    deleteItem,
    renameItem,
    addExample,
    deleteExample,
    sortItems
  };
}

function hasRequestInTarget(items: (Folder | SavedRequest)[], folderId: string | null, requestId: string) {
  if (!folderId) return items.some(item => item.type === 'request' && item.id === requestId);
  const folder = findFolder(items, folderId);
  return !!folder && folder.items.some(item => item.type === 'request' && item.id === requestId);
}

function findFolder(items: (Folder | SavedRequest)[], folderId: string): Folder | null {
  for (const item of items) {
    if (item.type === 'folder' && item.id === folderId) return item;
    if (item.type === 'folder') {
      const found = findFolder(item.items, folderId);
      if (found) return found;
    }
  }
  return null;
}

function updateRequestInItems(items: (Folder | SavedRequest)[], request: SavedRequest): (Folder | SavedRequest)[] {
  return items.map(item => {
    if (item.type === 'request' && item.id === request.id) return request;
    if (item.type === 'folder') return { ...item, items: updateRequestInItems(item.items, request) };
    return item;
  });
}

function removeRequestFromItems(items: (Folder | SavedRequest)[], requestId: string): (Folder | SavedRequest)[] {
  return items
    .filter(item => !(item.type === 'request' && item.id === requestId))
    .map(item => item.type === 'folder' ? { ...item, items: removeRequestFromItems(item.items, requestId) } : item);
}

function addRequestToFolder(items: (Folder | SavedRequest)[], folderId: string, request: SavedRequest): (Folder | SavedRequest)[] {
  return items.map(item => {
    if (item.type === 'folder' && item.id === folderId) return { ...item, items: [...item.items, request] };
    if (item.type === 'folder') return { ...item, items: addRequestToFolder(item.items, folderId, request) };
    return item;
  });
}

function filterItemFromItems(items: (Folder | SavedRequest)[], itemId: string): (Folder | SavedRequest)[] {
  return items
    .filter(item => item.id !== itemId)
    .map(item => item.type === 'folder' ? { ...item, items: filterItemFromItems(item.items, itemId) } : item);
}

function renameItemInItems(items: (Folder | SavedRequest)[], itemId: string, newName: string): (Folder | SavedRequest)[] {
  return items.map(item => {
    if (item.id === itemId) return { ...item, name: newName };
    if (item.type === 'folder') return { ...item, items: renameItemInItems(item.items, itemId, newName) };
    if (item.type === 'request' && item.examples) {
      return { ...item, examples: item.examples.map(e => e.id === itemId ? { ...e, name: newName } : e) };
    }
    return item;
  });
}

function addExampleToItems(
  items: (Folder | SavedRequest)[],
  requestId: string,
  exampleName: string,
  activeTab: TabData | undefined
): (Folder | SavedRequest)[] {
  return items.map(item => {
    if (item.type === 'folder') return { ...item, items: addExampleToItems(item.items, requestId, exampleName, activeTab) };
    if (item.type !== 'request' || item.id !== requestId) return item;
    const newExample: SavedExample = {
      id: crypto.randomUUID(),
      name: exampleName,
      code: activeTab?.response?.status || 200,
      status: activeTab?.response?.status_text || 'OK',
      body: activeTab?.response?.body || '',
      headers: Object.entries(activeTab?.response?.headers || {}).map(([key, value]) => ({ key, value }))
    };
    return { ...item, examples: [...(item.examples || []), newExample] };
  });
}

function deleteExampleFromItems(items: (Folder | SavedRequest)[], requestId: string, exampleId: string): (Folder | SavedRequest)[] {
  return items.map(item => {
    if (item.type === 'folder') return { ...item, items: deleteExampleFromItems(item.items, requestId, exampleId) };
    if (item.type === 'request' && item.id === requestId && item.examples) {
      return { ...item, examples: item.examples.filter(e => e.id !== exampleId) };
    }
    return item;
  });
}

function sortItemsByTarget(items: (Folder | SavedRequest)[], folderId: string | null, type: 'default' | 'az'): (Folder | SavedRequest)[] {
  const performSort = (list: (Folder | SavedRequest)[]) => {
    return [...list].sort((a, b) => {
      if (type === 'default') {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  if (!folderId) return performSort(items);
  return items.map(item => {
    if (item.type !== 'folder') return item;
    if (item.id === folderId) return { ...item, items: performSort(item.items) };
    return { ...item, items: sortItemsByTarget(item.items, folderId, type) };
  });
}
