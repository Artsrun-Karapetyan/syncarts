import type {
  SidebarMoveEntity,
  SidebarMoveTarget,
  Workspace,
} from "../core/types";
import { moveSidebarEntityInWorkspace } from "./collectionMoveHelpers";

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
