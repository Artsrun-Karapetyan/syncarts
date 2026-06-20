import type { Workspace } from "@/contexts/workspace/core/types";
import { api } from "@/lib/api";

interface DetailHydrationArgs {
  dirtyWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  syncingWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
}

export async function hydrateRemoteWorkspaceDetails(
  remotes: any[],
  locals: Workspace[],
  args: DetailHydrationArgs,
) {
  const localsById = new Map(
    locals.map((workspace) => [workspace.id, workspace]),
  );

  return Promise.all(
    remotes.map(async (remote) => {
      if (
        !shouldFetchWorkspaceDetail(remote, localsById.get(remote.id), args)
      ) {
        return remote;
      }

      try {
        const response: any = await api.get(`/workspaces/${remote.id}`);
        return response.data || remote;
      } catch (error) {
        console.error("Failed to fetch workspace details", remote.id, error);
        return remote;
      }
    }),
  );
}

function shouldFetchWorkspaceDetail(
  remote: any,
  local: Workspace | undefined,
  args: DetailHydrationArgs,
) {
  if (remote.data) return false;
  if (!remote.id) return false;
  if (!local) return true;
  if (
    args.dirtyWorkspaceIdsRef.current.has(remote.id) ||
    args.syncingWorkspaceIdsRef.current.has(remote.id)
  ) {
    return false;
  }
  if (typeof remote.version === "number")
    return local.version !== remote.version;
  return !!remote.updatedAt && local.updatedAt !== remote.updatedAt;
}
