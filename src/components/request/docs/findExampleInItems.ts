import type {
  Folder,
  SavedExample,
  SavedRequest,
} from "@/contexts/workspace/core/types";

export function findExampleInItems(
  items: (Folder | SavedRequest)[],
  exampleId: string,
): { example: SavedExample; requestId: string } | null {
  for (const item of items) {
    if (item.type === "request") {
      const example = item.examples?.find((entry) => entry.id === exampleId);
      if (example) return { example, requestId: item.id };
    }

    if (item.type === "folder") {
      const found = findExampleInItems(item.items, exampleId);
      if (found) return found;
    }
  }

  return null;
}
