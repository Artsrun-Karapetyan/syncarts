import type {
  Folder,
  SavedExample,
  SavedRequest,
  SidebarMoveEntity,
  SidebarMoveTarget,
  Workspace,
} from "@/contexts/workspace/core/types";

type SidebarTreeItem = Folder | SavedRequest;

interface RemoveResult {
  items: SidebarTreeItem[];
  removed: SidebarTreeItem | null;
}

interface InsertResult {
  items: SidebarTreeItem[];
  inserted: boolean;
}

interface RemoveExampleResult {
  items: SidebarTreeItem[];
  removed: SavedExample | null;
}

export function moveSidebarEntityInWorkspace(
  workspace: Workspace,
  source: SidebarMoveEntity,
  target: SidebarMoveTarget,
): Workspace {
  if (source.type === "collection")
    return moveCollection(workspace, source, target);
  if (source.type === "example") return moveExample(workspace, source, target);
  return moveTreeItem(workspace, source, target);
}

function moveCollection(
  workspace: Workspace,
  source: SidebarMoveEntity,
  target: SidebarMoveTarget,
): Workspace {
  if (target.type !== "collection") return workspace;
  if (source.collectionId === target.collectionId) return workspace;

  const sourceIndex = workspace.collections.findIndex(
    (collection) => collection.id === source.collectionId,
  );
  const targetIndex = workspace.collections.findIndex(
    (collection) => collection.id === target.collectionId,
  );
  if (sourceIndex < 0 || targetIndex < 0) return workspace;

  const collections = [...workspace.collections];
  const [moved] = collections.splice(sourceIndex, 1);
  const nextTargetIndex = collections.findIndex(
    (collection) => collection.id === target.collectionId,
  );
  const insertIndex =
    target.position === "after" ? nextTargetIndex + 1 : nextTargetIndex;

  collections.splice(insertIndex, 0, moved);
  return { ...workspace, collections };
}

function moveExample(
  workspace: Workspace,
  source: SidebarMoveEntity,
  target: SidebarMoveTarget,
): Workspace {
  if (!source.itemId) return workspace;
  if (source.itemId === target.itemId) return workspace;
  if (target.type !== "request" && target.type !== "example") return workspace;

  let removedExample: SavedExample | null = null;
  const collectionsWithoutSource = workspace.collections.map((collection) => {
    if (collection.id !== source.collectionId) return collection;
    const result = removeExample(collection.items, source.itemId!);
    removedExample = result.removed;
    return result.removed ? { ...collection, items: result.items } : collection;
  });
  if (!removedExample) return workspace;

  let didInsert = false;
  const collections = collectionsWithoutSource.map((collection) => {
    if (collection.id !== target.collectionId) return collection;
    const result = insertExample(collection.items, removedExample!, target);
    didInsert = result.inserted;
    return result.inserted
      ? { ...collection, items: result.items }
      : collection;
  });

  if (!didInsert) return workspace;
  return { ...workspace, collections };
}

function moveTreeItem(
  workspace: Workspace,
  source: SidebarMoveEntity,
  target: SidebarMoveTarget,
): Workspace {
  if (!source.itemId) return workspace;
  if (target.itemId === source.itemId) return workspace;

  const sourceCollection = workspace.collections.find(
    (collection) => collection.id === source.collectionId,
  );
  if (!sourceCollection) return workspace;

  const sourceItem = findTreeItem(sourceCollection.items, source.itemId);
  if (!sourceItem) return workspace;
  if (sourceItem.type === "folder" && target.itemId) {
    if (containsTreeItem(sourceItem.items, target.itemId)) return workspace;
  }

  const collectionsWithoutSource = workspace.collections.map((collection) => {
    if (collection.id !== source.collectionId) return collection;
    const result = removeTreeItem(collection.items, source.itemId!);
    return result.removed ? { ...collection, items: result.items } : collection;
  });

  let didInsert = false;
  const collections = collectionsWithoutSource.map((collection) => {
    if (collection.id !== target.collectionId) return collection;
    const result = insertTreeItem(collection.items, sourceItem, target);
    didInsert = result.inserted;
    return result.inserted
      ? { ...collection, items: result.items }
      : collection;
  });

  if (!didInsert) return workspace;
  return { ...workspace, collections };
}

function findTreeItem(
  items: SidebarTreeItem[],
  itemId: string,
): SidebarTreeItem | null {
  for (const item of items) {
    if (item.id === itemId) return item;
    if (item.type === "folder") {
      const found = findTreeItem(item.items, itemId);
      if (found) return found;
    }
  }
  return null;
}

function containsTreeItem(items: SidebarTreeItem[], itemId: string): boolean {
  return !!findTreeItem(items, itemId);
}

function removeTreeItem(
  items: SidebarTreeItem[],
  itemId: string,
): RemoveResult {
  let removed: SidebarTreeItem | null = null;
  const nextItems: SidebarTreeItem[] = [];

  for (const item of items) {
    if (item.id === itemId) {
      removed = item;
      continue;
    }

    if (item.type === "folder") {
      const result = removeTreeItem(item.items, itemId);
      if (result.removed) {
        removed = result.removed;
        nextItems.push({ ...item, items: result.items });
        continue;
      }
    }

    nextItems.push(item);
  }

  return { items: nextItems, removed };
}

function removeExample(
  items: SidebarTreeItem[],
  exampleId: string,
): RemoveExampleResult {
  let removed: SavedExample | null = null;
  const nextItems = items.map((item) => {
    if (item.type === "request") {
      const examples = item.examples || [];
      const target = examples.find((example) => example.id === exampleId);
      if (!target) return item;
      removed = target;
      return {
        ...item,
        examples: examples.filter((example) => example.id !== exampleId),
      };
    }

    const result = removeExample(item.items, exampleId);
    if (!result.removed) return item;
    removed = result.removed;
    return { ...item, items: result.items };
  });

  return { items: nextItems, removed };
}

function insertExample(
  items: SidebarTreeItem[],
  example: SavedExample,
  target: SidebarMoveTarget,
): InsertResult {
  const nextItems: SidebarTreeItem[] = [];
  let inserted = false;

  for (const item of items) {
    if (item.type === "request") {
      const result = insertExampleInRequest(item, example, target);
      if (result.inserted) {
        nextItems.push(result.request);
        inserted = true;
        continue;
      }
    }

    if (item.type === "folder") {
      const result = insertExample(item.items, example, target);
      if (result.inserted) {
        nextItems.push({ ...item, items: result.items });
        inserted = true;
        continue;
      }
    }

    nextItems.push(item);
  }

  return { items: nextItems, inserted };
}

function insertExampleInRequest(
  request: SavedRequest,
  example: SavedExample,
  target: SidebarMoveTarget,
) {
  const examples = request.examples || [];

  if (target.type === "request" && target.itemId === request.id) {
    return {
      request: { ...request, examples: [...examples, example] },
      inserted: true,
    };
  }

  if (target.type !== "example" || target.requestId !== request.id) {
    return { request, inserted: false };
  }

  const targetIndex = examples.findIndex((item) => item.id === target.itemId);
  if (targetIndex < 0) return { request, inserted: false };

  const nextExamples = [...examples];
  nextExamples.splice(
    target.position === "after" ? targetIndex + 1 : targetIndex,
    0,
    example,
  );
  return { request: { ...request, examples: nextExamples }, inserted: true };
}

function insertTreeItem(
  items: SidebarTreeItem[],
  item: SidebarTreeItem,
  target: SidebarMoveTarget,
): InsertResult {
  if (target.type === "collection") {
    return { items: [...items, item], inserted: true };
  }

  if (!target.itemId) return { items, inserted: false };
  const nextItems: SidebarTreeItem[] = [];
  let inserted = false;

  for (const current of items) {
    if (current.id === target.itemId) {
      if (target.position === "before") {
        nextItems.push(item, current);
        inserted = true;
        continue;
      }

      if (target.position === "inside" && current.type === "folder") {
        nextItems.push({ ...current, items: [...current.items, item] });
        inserted = true;
        continue;
      }

      nextItems.push(current, item);
      inserted = true;
      continue;
    }

    if (current.type === "folder") {
      const result = insertTreeItem(current.items, item, target);
      if (result.inserted) {
        nextItems.push({ ...current, items: result.items });
        inserted = true;
        continue;
      }
    }

    nextItems.push(current);
  }

  return { items: nextItems, inserted };
}
