import { useRef, useState } from "react";

import { runWorkspaceRequest } from "../../../contexts/workspace/requests/runWorkspaceRequest";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { getCollectionRunItems } from "./collectionRunItems";
import type { CollectionRunResult } from "./collectionRunTypes";
import { getCollectionRunStatus } from "./getCollectionRunStatus";

export function useCollectionRunner() {
  const {
    activeEnvironment,
    activeEnvironmentId,
    collections,
    environments,
    globalVariables,
    responseCache,
    updateCollection,
    updateEnvironment,
    updateFolder,
    updateGlobalVariables,
    updateResponseCache,
  } = useWorkspace();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CollectionRunResult[]>([]);
  const stopRequestedRef = useRef(false);

  const stopCollection = () => {
    stopRequestedRef.current = true;
  };

  const runCollection = async (collectionId: string, folderId?: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection || isRunning) return;

    const items = getCollectionRunItems(collection, folderId);
    const collectionVariablesDraft = [...(collection.variables || [])];
    const nextResults: CollectionRunResult[] = [];
    const responseCacheDraft = { ...responseCache };

    setCurrentIndex(0);
    setResults([]);
    setIsRunning(true);
    stopRequestedRef.current = false;

    try {
      for (const [index, item] of items.entries()) {
        if (stopRequestedRef.current) break;
        setCurrentIndex(index + 1);
        const startedAt = performance.now();

        try {
          const result = await runWorkspaceRequest({
            activeEnvironment,
            activeEnvironmentId,
            collectionId,
            collectionVariablesDraft,
            collections,
            environments,
            globalVariables,
            requestTab: item.tab,
            responseCache: responseCacheDraft,
            updateEnvironment,
            updateFolder,
            updateGlobalVariables,
          });
          responseCacheDraft[item.request.id] = result.response;
          updateResponseCache(item.request.id, result.response);
          nextResults.push({
            durationMs: Math.round(performance.now() - startedAt),
            item,
            response: result.response,
            status: getCollectionRunStatus(
              result.response.status,
              result.testResults,
            ),
            testResults: result.testResults,
          });
        } catch (error) {
          nextResults.push({
            durationMs: Math.round(performance.now() - startedAt),
            error: error instanceof Error ? error.message : String(error),
            item,
            status: "failed",
            testResults: [],
          });
        }

        setResults([...nextResults]);
      }
      updateCollection(collectionId, { variables: collectionVariablesDraft });
    } finally {
      setIsRunning(false);
    }
  };

  return { currentIndex, isRunning, results, runCollection, stopCollection };
}
