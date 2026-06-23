import { moveSidebarEntityInWorkspace } from "@/contexts/workspace/collections/collectionMoveHelpers";
import type {
  SidebarMoveEntity,
  SidebarMoveTarget,
  Workspace,
} from "@/contexts/workspace/core/types";

interface CollectionMoveActionsArgs {
  activeWorkspaceId: string;
  updateWorkspaces: (updater: (prev: Workspace[]) => Workspace[]) => void;
}

export function useCollectionMoveActions(args: CollectionMoveActionsArgs) {
  const moveSidebarItem = (
    source: SidebarMoveEntity,
    target: SidebarMoveTarget,
  ) => {
    args.updateWorkspaces((prev) =>
      prev.map((workspace) =>
        workspace.id === args.activeWorkspaceId
          ? moveSidebarEntityInWorkspace(workspace, source, target)
          : workspace,
      ),
    );
  };

  return { moveSidebarItem };
}
