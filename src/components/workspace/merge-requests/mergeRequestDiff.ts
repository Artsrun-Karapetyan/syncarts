export interface MergeRequestDiffItem {
  changedKeys?: string[];
  diffColor: string;
  diffSymbol: string;
  diffType: "added" | "modified" | "deleted";
  id: string;
  method?: string;
  name?: string;
  type?: string;
  url?: string;
  originalItem?: any;
}

export function getMergeRequestChanges(targetCol: any, sourceCollection: any) {
  const targetFlat = flattenItems(targetCol.items || []);
  const sourceFlat = flattenItems(sourceCollection.items || []);

  const added = sourceFlat.filter(
    (sourceItem) =>
      !targetFlat.find((targetItem) => targetItem.id === sourceItem.id),
  );
  const deleted = targetFlat.filter(
    (targetItem) =>
      !sourceFlat.find((sourceItem) => sourceItem.id === targetItem.id),
  );
  const modified = sourceFlat
    .map((sourceItem) => {
      const targetItem = targetFlat.find((item) => item.id === sourceItem.id);
      if (!targetItem) return null;
      const sourceCompare = omitDiffMeta(sourceItem);
      const targetCompare = omitDiffMeta(targetItem);
      const isDiff =
        JSON.stringify(sourceCompare) !== JSON.stringify(targetCompare);
      if (!isDiff) return null;
      const changedKeys = Object.keys(sourceCompare).filter(
        (key) =>
          key !== "changedKeys" &&
          JSON.stringify(sourceCompare[key]) !==
            JSON.stringify(targetCompare[key]),
      );
      return { ...sourceItem, changedKeys, originalItem: targetItem };
    })
    .filter(Boolean);

  return {
    added,
    deleted,
    modified,
    allChanges: [
      ...added.map((item) => withDiff(item, "added", "+", "#00ffaa")),
      ...modified.map((item) => withDiff(item, "modified", "~", "#ffaa00")),
      ...deleted.map((item) => withDiff(item, "deleted", "-", "#ff5050")),
    ] as MergeRequestDiffItem[],
  };
}

function flattenItems(items: any[]): any[] {
  let flat: any[] = [];
  for (const item of items) {
    if (item.type === "folder") {
      flat.push({ ...item, items: undefined });
      if (item.items) flat = flat.concat(flattenItems(item.items));
    } else {
      flat.push(item);
    }
  }
  return flat;
}

function omitDiffMeta(item: any) {
  return {
    ...item,
    updatedAt: undefined,
    parentId: undefined,
    changedKeys: undefined,
  };
}

function withDiff(
  item: any,
  diffType: MergeRequestDiffItem["diffType"],
  diffSymbol: string,
  diffColor: string,
) {
  return { ...item, diffType, diffSymbol, diffColor };
}

export function formatDiffValue(val: any): string {
  if (val === undefined || val === null) return "null";
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}
