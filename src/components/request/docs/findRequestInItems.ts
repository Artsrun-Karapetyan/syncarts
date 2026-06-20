import type { Folder, SavedRequest } from "@/contexts/workspace/core/types";

export function findRequestInItems(
  items: (Folder | SavedRequest)[],
  requestId: string,
): SavedRequest | null {
  for (const item of items) {
    if (item.type === "request" && item.id === requestId) return item;
    if (item.type === "folder") {
      const found = findRequestInItems(item.items, requestId);
      if (found) return found;
    }
  }
  return null;
}
