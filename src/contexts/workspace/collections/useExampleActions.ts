import {
  addExampleToItems,
  deleteExampleFromItems,
  duplicateExampleInItems,
  updateExampleInItems,
} from "@/contexts/workspace/collections/collectionItemHelpers";
import type {
  SavedExample,
  TabData,
  Workspace,
} from "@/contexts/workspace/core/types";

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
    exampleId: string = crypto.randomUUID(),
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
                    exampleId,
                  ),
                }
              : col,
          ),
        };
      }),
    );
    return exampleId;
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

  const duplicateExample = (
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
                  items: duplicateExampleInItems(
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

  return { addExample, deleteExample, updateExample, duplicateExample };
}
