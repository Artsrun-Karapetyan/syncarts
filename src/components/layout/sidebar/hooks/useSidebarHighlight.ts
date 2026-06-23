import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

import {
  findExamplePath,
  findRequestPath,
} from "@/components/layout/sidebar/utils/utils";
import type { Collection, TabData } from "@/contexts/WorkspaceContext";

interface Args {
  activeTab: TabData | undefined;
  collections: Collection[];
  resolveTabSavedRequestId: (tab?: TabData) => string | undefined;
  setExpandedCollections: Dispatch<SetStateAction<Record<string, boolean>>>;
  setExpandedFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
}

interface HighlightDetail {
  exampleId?: string;
  savedRequestId?: string;
}

export function useSidebarHighlight(args: Args) {
  const {
    activeTab,
    collections,
    resolveTabSavedRequestId,
    setExpandedCollections,
    setExpandedFolders,
  } = args;
  const [highlightedRequestId, setHighlightedRequestId] = useState<
    string | null
  >(null);
  const [highlightedExampleId, setHighlightedExampleId] = useState<
    string | null
  >(null);

  const highlightedCollectionId =
    activeTab?.type === "collection" ? activeTab.collectionId || null : null;
  const highlightedFolderId =
    activeTab?.type === "folder" ? activeTab.folderId || null : null;

  const expandPath = (collectionId: string, folderIds: string[]) => {
    setExpandedCollections((prev) => ({ ...prev, [collectionId]: true }));
    setExpandedFolders((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const folderId of folderIds) {
        if (!next[folderId]) {
          next[folderId] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  };

  const highlightRequest = (savedRequestId?: string, exampleId?: string) => {
    if (!savedRequestId) return;
    const requestPath = findRequestPath(collections, savedRequestId);
    if (!requestPath) return;
    expandPath(requestPath.collectionId, requestPath.folderIds);
    setHighlightedRequestId(savedRequestId);
    setHighlightedExampleId(exampleId || null);
  };

  const highlightExample = (exampleId?: string) => {
    if (!exampleId) return;
    const examplePath = findExamplePath(collections, exampleId);
    if (!examplePath) return;
    expandPath(examplePath.collectionId, examplePath.folderIds);
    setHighlightedRequestId(null);
    setHighlightedExampleId(exampleId);
  };

  useEffect(() => {
    if (activeTab?.type === "example") {
      highlightExample(activeTab.exampleId);
      return;
    }

    const savedRequestId = resolveTabSavedRequestId(activeTab);
    if (savedRequestId) highlightRequest(savedRequestId);
    else {
      setHighlightedRequestId(null);
      setHighlightedExampleId(null);
    }

    if (activeTab?.type === "collection" && activeTab.collectionId) {
      setExpandedCollections((prev) => ({
        ...prev,
        [activeTab.collectionId!]: true,
      }));
    }

    if (
      activeTab?.type === "folder" &&
      activeTab.collectionId &&
      activeTab.folderId
    ) {
      setExpandedCollections((prev) => ({
        ...prev,
        [activeTab.collectionId!]: true,
      }));
      setExpandedFolders((prev) => ({ ...prev, [activeTab.folderId!]: true }));
    }
  }, [activeTab, collections, resolveTabSavedRequestId]);

  useEffect(() => {
    const onHighlightEvent = (event: Event) => {
      const detail = (event as CustomEvent<HighlightDetail>).detail;
      if (detail?.exampleId) highlightExample(detail.exampleId);
      else highlightRequest(detail?.savedRequestId);
    };
    window.addEventListener("highlight-sidebar", onHighlightEvent);
    return () =>
      window.removeEventListener("highlight-sidebar", onHighlightEvent);
  }, [collections]);

  return {
    highlightedCollectionId,
    highlightedExampleId,
    highlightedFolderId,
    highlightedRequestId,
  };
}
