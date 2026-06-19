import type { Collection } from "../../../contexts/WorkspaceContext";
import { exportCollectionFile } from "./exportCollectionFile";
import { findFolder, findRequest } from "./utils";

export function useSidebarExportHandlers(collections: Collection[]) {
  const handleExportCollection = async (collectionId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    await exportCollectionFile(collection.name || "collection", collection);
  };

  const handleExportFolder = async (collectionId: string, folderId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const folder = findFolder(collection.items, folderId);
    if (!folder) return;
    await exportCollectionFile(folder.name || "folder", {
      ...collection,
      name: folder.name,
      description: folder.description || "",
      items: [folder],
    });
  };

  const handleExportRequest = async (
    collectionId: string,
    requestId: string,
  ) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const request = findRequest(collection.items, requestId);
    if (!request) return;
    await exportCollectionFile(request.name || "request", {
      ...collection,
      name: request.name,
      description: request.description || "",
      items: [request],
    });
  };

  return { handleExportCollection, handleExportFolder, handleExportRequest };
}
