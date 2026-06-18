import type {
  Folder,
  SavedExample,
  SavedRequest,
  TabData,
} from "../core/types";

export function hasRequestInTarget(
  items: (Folder | SavedRequest)[],
  folderId: string | null,
  requestId: string,
) {
  if (!folderId) {
    return items.some(
      (item) => item.type === "request" && item.id === requestId,
    );
  }
  const folder = findFolder(items, folderId);
  return (
    !!folder &&
    folder.items.some(
      (item) => item.type === "request" && item.id === requestId,
    )
  );
}

export function updateRequestInItems(
  items: (Folder | SavedRequest)[],
  request: SavedRequest,
): (Folder | SavedRequest)[] {
  return items.map((item) => {
    if (item.type === "request" && item.id === request.id) return request;
    if (item.type === "folder") {
      return { ...item, items: updateRequestInItems(item.items, request) };
    }
    return item;
  });
}

export function removeRequestFromItems(
  items: (Folder | SavedRequest)[],
  requestId: string,
): (Folder | SavedRequest)[] {
  return items
    .filter((item) => !(item.type === "request" && item.id === requestId))
    .map((item) =>
      item.type === "folder"
        ? { ...item, items: removeRequestFromItems(item.items, requestId) }
        : item,
    );
}

export function addRequestToFolder(
  items: (Folder | SavedRequest)[],
  folderId: string,
  request: SavedRequest,
): (Folder | SavedRequest)[] {
  return items.map((item) => {
    if (item.type === "folder" && item.id === folderId) {
      return { ...item, items: [...item.items, request] };
    }
    if (item.type === "folder") {
      return {
        ...item,
        items: addRequestToFolder(item.items, folderId, request),
      };
    }
    return item;
  });
}

export function filterItemFromItems(
  items: (Folder | SavedRequest)[],
  itemId: string,
): (Folder | SavedRequest)[] {
  return items
    .filter((item) => item.id !== itemId)
    .map((item) =>
      item.type === "folder"
        ? { ...item, items: filterItemFromItems(item.items, itemId) }
        : item,
    );
}

export function renameItemInItems(
  items: (Folder | SavedRequest)[],
  itemId: string,
  newName: string,
): (Folder | SavedRequest)[] {
  return items.map((item) => {
    if (item.id === itemId) return { ...item, name: newName };
    if (item.type === "folder") {
      return { ...item, items: renameItemInItems(item.items, itemId, newName) };
    }
    if (item.type === "request" && item.examples) {
      return {
        ...item,
        examples: item.examples.map((example) =>
          example.id === itemId ? { ...example, name: newName } : example,
        ),
      };
    }
    return item;
  });
}

export function addExampleToItems(
  items: (Folder | SavedRequest)[],
  requestId: string,
  exampleName: string,
  activeTab: TabData | undefined,
  exampleId: string = crypto.randomUUID(),
): (Folder | SavedRequest)[] {
  return items.map((item) => {
    if (item.type === "folder") {
      return {
        ...item,
        items: addExampleToItems(
          item.items,
          requestId,
          exampleName,
          activeTab,
          exampleId,
        ),
      };
    }
    if (item.type !== "request" || item.id !== requestId) return item;
    const newExample: SavedExample = {
      id: exampleId,
      name: exampleName,
      code: activeTab?.response?.status || 200,
      status: activeTab?.response?.status_text || "OK",
      body: activeTab?.response?.body || "",
      headers: Object.entries(activeTab?.response?.headers || {}).map(
        ([key, value]) => ({ key, value }),
      ),
      originalRequest: activeTab
        ? {
            method: activeTab.method,
            url: activeTab.url,
            headers: activeTab.headers,
            authType: activeTab.authType,
            bearerToken: activeTab.bearerToken,
            bodyType: activeTab.bodyType,
            description: activeTab.description,
            pathVariables: activeTab.pathVariables,
            queryParamDescriptions: activeTab.queryParamDescriptions,
            queryParams: activeTab.queryParams,
            preRequestScript: activeTab.preRequestScript,
            testScript: activeTab.testScript,
            formData: activeTab.formData,
            body: activeTab.body,
          }
        : undefined,
    };
    return { ...item, examples: [...(item.examples || []), newExample] };
  });
}

export function deleteExampleFromItems(
  items: (Folder | SavedRequest)[],
  requestId: string,
  exampleId: string,
): (Folder | SavedRequest)[] {
  return items.map((item) => {
    if (item.type === "folder") {
      return {
        ...item,
        items: deleteExampleFromItems(item.items, requestId, exampleId),
      };
    }
    if (item.type === "request" && item.id === requestId && item.examples) {
      return {
        ...item,
        examples: item.examples.filter((example) => example.id !== exampleId),
      };
    }
    return item;
  });
}

export function updateExampleInItems(
  items: (Folder | SavedRequest)[],
  requestId: string,
  exampleId: string,
  data: Partial<SavedExample>,
): (Folder | SavedRequest)[] {
  return items.map((item) => {
    if (item.type === "folder") {
      return {
        ...item,
        items: updateExampleInItems(item.items, requestId, exampleId, data),
      };
    }
    if (item.type === "request" && item.id === requestId && item.examples) {
      return {
        ...item,
        examples: item.examples.map((example) =>
          example.id === exampleId ? { ...example, ...data } : example,
        ),
      };
    }
    return item;
  });
}

export function sortItemsByTarget(
  items: (Folder | SavedRequest)[],
  folderId: string | null,
  type: "default" | "az",
): (Folder | SavedRequest)[] {
  const performSort = (list: (Folder | SavedRequest)[]) => {
    return [...list].sort((a, b) => {
      if (type === "default") {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  if (!folderId) return performSort(items);
  return items.map((item) => {
    if (item.type !== "folder") return item;
    if (item.id === folderId) {
      return { ...item, items: performSort(item.items) };
    }
    return { ...item, items: sortItemsByTarget(item.items, folderId, type) };
  });
}

function findFolder(
  items: (Folder | SavedRequest)[],
  folderId: string,
): Folder | null {
  for (const item of items) {
    if (item.type === "folder" && item.id === folderId) return item;
    if (item.type === "folder") {
      const found = findFolder(item.items, folderId);
      if (found) return found;
    }
  }
  return null;
}
