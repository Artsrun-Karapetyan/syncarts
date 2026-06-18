import { api } from "../../../lib/api";
import type { Collection, Workspace } from "../core/types";

export function createPulledForkCollection(
  forkCollection: Collection,
  sourceCollection: Collection,
): Collection {
  return {
    ...sourceCollection,
    id: forkCollection.id,
    name: forkCollection.name,
    createdAt: forkCollection.createdAt,
    fork: forkCollection.fork,
  };
}

export function replaceCollectionInWorkspace(
  workspaces: Workspace[],
  workspaceId: string,
  collectionId: string,
  collection: Collection,
) {
  return workspaces.map((workspace) => {
    if (workspace.id !== workspaceId) return workspace;
    return {
      ...workspace,
      collections: workspace.collections.map((item) =>
        item.id === collectionId ? collection : item,
      ),
    };
  });
}

interface PullForkCollectionArgs {
  activeWorkspaceId: string;
  collectionId: string;
  updateWorkspaces: (updater: (prev: Workspace[]) => Workspace[]) => void;
  workspaces: Workspace[];
}

export async function pullForkCollection({
  activeWorkspaceId,
  collectionId,
  updateWorkspaces,
  workspaces,
}: PullForkCollectionArgs) {
  const workspace = workspaces.find((item) => item.id === activeWorkspaceId);
  const forkCollection = workspace?.collections.find(
    (item) => item.id === collectionId,
  );

  if (!forkCollection?.fork) {
    throw new Error("Only forked collections can pull changes");
  }

  const response = await api.get<Workspace>(
    `/workspaces/${forkCollection.fork.originalWorkspaceId}`,
  );
  const sourceCollection = getWorkspaceCollections(response.data).find(
    (item) => item.id === forkCollection.fork?.originalCollectionId,
  );

  if (!sourceCollection) {
    throw new Error("Original collection was not found");
  }

  const pulledCollection = createPulledForkCollection(
    forkCollection,
    sourceCollection,
  );
  updateWorkspaces((prev) =>
    replaceCollectionInWorkspace(
      prev,
      activeWorkspaceId,
      collectionId,
      pulledCollection,
    ),
  );
}

export function getWorkspaceCollections(
  workspace: Workspace | { data?: { collections?: Collection[] } },
): Collection[] {
  return (
    ("data" in workspace ? workspace.data?.collections : undefined) ||
    ("collections" in workspace ? workspace.collections : undefined) ||
    []
  );
}
