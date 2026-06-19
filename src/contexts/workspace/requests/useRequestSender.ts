import { useState } from "react";

import type {
  Collection,
  Environment,
  EnvironmentVariable,
  Folder,
  HttpResponse,
  SavedRequest,
  TabData,
} from "../core/types";
import { createRequestErrorResponse } from "./createRequestErrorResponse";
import { runWorkspaceRequest } from "./runWorkspaceRequest";

interface RequestSenderArgs {
  activeEnvironment: Environment | undefined;
  activeEnvironmentId: string | null;
  activeTab: TabData | undefined;
  collections: Collection[];
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  updateActiveTab: (data: Partial<TabData>) => void;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  updateFolder: (collectionId: string, folderId: string, data: any) => void;
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
  responseCache: Record<string, HttpResponse>;
  updateResponseCache: (id: string, response: HttpResponse) => void;
}

export function useRequestSender(args: RequestSenderArgs) {
  const {
    activeEnvironment,
    activeEnvironmentId,
    activeTab,
    collections,
    environments,
    globalVariables,
    updateActiveTab,
    updateCollection,
    updateFolder,
    updateEnvironment,
    updateGlobalVariables,
    responseCache,
    updateResponseCache,
  } = args;

  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const sendRequest = async () => {
    if (!activeTab) return;
    setIsMutating(true);
    setError(null);
    try {
      updateActiveTab({ response: null });
      const collectionContext = findCollectionForTab(activeTab, collections);
      const col = collectionContext?.collection || null;
      const collectionVariablesDraft = [...(col?.variables || [])];
      const result = await runWorkspaceRequest({
        activeEnvironment,
        activeEnvironmentId,
        collectionId: collectionContext?.collectionId,
        collectionVariablesDraft,
        collections,
        environments,
        globalVariables,
        requestTab: activeTab,
        responseCache,
        updateEnvironment,
        updateFolder,
        updateGlobalVariables,
      });
      if (collectionContext) {
        updateCollection(collectionContext.collectionId, {
          variables: collectionVariablesDraft,
        });
      }
      if (activeTab.savedRequestId) {
        updateResponseCache(activeTab.savedRequestId, result.response);
      }
      updateActiveTab({
        consoleLogs: result.consoleLogs,
        response: result.response,
        testResults: result.testResults,
      });
      return result.response;
    } catch (err) {
      setError(err);
      const message = err instanceof Error ? err.message : String(err);
      const response = createRequestErrorResponse(message);
      updateActiveTab({
        response,
        consoleLogs: [`[REQUEST ERROR] ${message}`],
      });
      return response;
    } finally {
      setIsMutating(false);
    }
  };

  return { sendRequest, isMutating, error };
}

function findCollectionForTab(tab: TabData, collections: Collection[]) {
  if (tab.collectionId) {
    const collection = collections.find((c) => c.id === tab.collectionId);
    if (collection) return { collectionId: collection.id, collection };
  }

  const requestId = tab.savedRequestId || tab.id;
  for (const collection of collections) {
    if (hasRequest(collection.items, requestId))
      return { collectionId: collection.id, collection };
  }
  return null;
}

function hasRequest(
  items: (Folder | SavedRequest)[],
  requestId: string,
): boolean {
  for (const item of items) {
    if (item.type === "request" && item.id === requestId) return true;
    if (item.type === "folder" && hasRequest(item.items, requestId))
      return true;
  }
  return false;
}
