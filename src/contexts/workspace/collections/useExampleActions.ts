import type { SavedExample, TabData, Workspace } from "../core/types";
import {
  addExampleToItems,
  deleteExampleFromItems,
  updateExampleInItems,
} from "./collectionItemHelpers";

interface ExampleActionsArgs {
  activeTab: TabData | undefined;
  activeWorkspaceId: string;
  updateWorkspaces: (updater: (prev: Workspace[]) => Workspace[]) => void;
}

export function useExampleActions(args: ExampleActionsArgs) {
  const { activeTab, activeWorkspaceId, updateWorkspaces } = args;

  const addExample = (
    collectionId: string,
    requestId: string,
    exampleName: string,
  ) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        return {
          ...w,
          collections: w.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  items: addExampleToItems(
                    col.items,
                    requestId,
                    exampleName,
                    activeTab,
                  ),
                }
              : col,
          ),
        };
      }),
    );
  };

  const deleteExample = (
    collectionId: string,
    requestId: string,
    exampleId: string,
  ) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        return {
          ...w,
          collections: w.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  items: deleteExampleFromItems(
                    col.items,
                    requestId,
                    exampleId,
                  ),
                }
              : col,
          ),
        };
      }),
    );
  };

  const updateExample = (
    collectionId: string,
    requestId: string,
    exampleId: string,
    data: Partial<SavedExample>,
  ) => {
    updateWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== activeWorkspaceId) return w;
        return {
          ...w,
          collections: w.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  items: updateExampleInItems(
                    col.items,
                    requestId,
                    exampleId,
                    data,
                  ),
                }
              : col,
          ),
        };
      }),
    );
  };

  return { addExample, deleteExample, updateExample };
}
