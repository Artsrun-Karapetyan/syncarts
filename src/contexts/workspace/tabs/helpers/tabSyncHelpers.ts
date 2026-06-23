import type {
  SavedRequestLocation,
  TabData,
} from "@/contexts/workspace/core/types";
import { requestSnapshot } from "@/contexts/workspace/tabs/helpers/tabHelpers";

interface NormalizeSavedTabsArgs {
  currentTabs: TabData[];
  findSavedRequestById: (requestId?: string) => SavedRequestLocation | null;
  lastSavedTabSnapshots: Record<string, string>;
}

export function normalizeTabsWithSavedRequests({
  currentTabs,
  findSavedRequestById,
  lastSavedTabSnapshots,
}: NormalizeSavedTabsArgs) {
  let changed = false;
  const normalizedTabs = currentTabs.map((tab) => {
    if (tab.type && tab.type !== "request") return tab;
    const requestId = tab.savedRequestId || tab.id;
    const saved = findSavedRequestById(requestId);
    if (!saved) return tab;
    const savedSnapshot = requestSnapshot(saved.request);
    const tabSnapshot = requestSnapshot(tab);
    const baselineSnapshot = lastSavedTabSnapshots[tab.id] || tabSnapshot;
    lastSavedTabSnapshots[tab.id] = baselineSnapshot;

    if (tabSnapshot !== baselineSnapshot) return tab;
    if (tab.savedRequestId && savedSnapshot === baselineSnapshot) return tab;

    changed = true;
    lastSavedTabSnapshots[tab.id] = savedSnapshot;
    return {
      ...tab,
      ...saved.request,
      id: tab.id,
      type: "request" as const,
      savedRequestId: requestId,
      collectionId: saved.collectionId,
      folderId: saved.folderId || undefined,
      pathVariables: saved.request.pathVariables,
      response: tab.response,
      testResults: tab.testResults,
      consoleLogs: tab.consoleLogs,
    };
  });

  return { changed, normalizedTabs };
}
