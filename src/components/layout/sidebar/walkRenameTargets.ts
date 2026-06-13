import type {
  Folder as IFolder,
  SavedRequest,
} from "../../../contexts/WorkspaceContext";

export function walkRenameTargets(
  items: (IFolder | SavedRequest)[],
  targetId: string,
): boolean {
  for (const item of items) {
    if (item.id === targetId) return true;
    if (
      item.type === "request" &&
      item.examples?.some((example) => example.id === targetId)
    )
      return true;
    if (item.type === "folder" && walkRenameTargets(item.items, targetId))
      return true;
  }

  return false;
}
