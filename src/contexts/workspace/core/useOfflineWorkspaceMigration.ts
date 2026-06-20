import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";

import type { TabData, Workspace } from "@/contexts/workspace/core/types";

interface OfflineWorkspaceMigrationArgs {
  storageHydrated: boolean;
  userId: string;
  setWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
  setTabsByWorkspace: Dispatch<SetStateAction<Record<string, TabData[]>>>;
  setActiveTabIdByWorkspace: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
  setActiveEnvIdByWorkspace: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
}

export function useOfflineWorkspaceMigration({
  storageHydrated,
  userId,
  setWorkspaces,
  setTabsByWorkspace,
  setActiveTabIdByWorkspace,
  setActiveEnvIdByWorkspace,
}: OfflineWorkspaceMigrationArgs) {
  useEffect(() => {
    if (!storageHydrated || userId === "offline") return;
    try {
      const offlineData = window.localStorage.getItem(
        "syncarts-workspaces-v3-offline",
      );
      if (!offlineData) return;

      const offlineWorkspaces: Workspace[] = JSON.parse(offlineData);
      const localOfflineWorkspaces = offlineWorkspaces.filter(
        (w) => w.type === "local",
      );

      if (localOfflineWorkspaces.length > 0) {
        setWorkspaces((prev) => {
          const prevIds = new Set(prev.map((w) => w.id));
          const missingLocals = localOfflineWorkspaces.filter(
            (w) => !prevIds.has(w.id),
          );

          if (missingLocals.length > 0) {
            missingLocals.forEach((w) => {
              try {
                const tabsData = window.localStorage.getItem(
                  "syncarts-tabs-by-workspace-v3-offline",
                );
                if (tabsData) {
                  const tabs = JSON.parse(tabsData);
                  if (tabs[w.id]) {
                    setTabsByWorkspace((tPrev) => ({
                      ...tPrev,
                      [w.id]: tabs[w.id],
                    }));
                  }
                }
                const activeTabData = window.localStorage.getItem(
                  "syncarts-active-tab-by-workspace-v3-offline",
                );
                if (activeTabData) {
                  const activeTab = JSON.parse(activeTabData);
                  if (activeTab[w.id]) {
                    setActiveTabIdByWorkspace((aPrev) => ({
                      ...aPrev,
                      [w.id]: activeTab[w.id],
                    }));
                  }
                }
                const activeEnvData = window.localStorage.getItem(
                  "syncarts-active-env-by-workspace-v3-offline",
                );
                if (activeEnvData) {
                  const activeEnv = JSON.parse(activeEnvData);
                  if (activeEnv[w.id]) {
                    setActiveEnvIdByWorkspace((ePrev) => ({
                      ...ePrev,
                      [w.id]: activeEnv[w.id],
                    }));
                  }
                }
              } catch (e) {
                console.error(
                  "Failed to migrate offline tabs/env for local workspace",
                  w.id,
                  e,
                );
              }
            });
            return [...prev, ...missingLocals];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to migrate offline local workspaces", err);
    }
  }, [
    storageHydrated,
    userId,
    setWorkspaces,
    setTabsByWorkspace,
    setActiveTabIdByWorkspace,
    setActiveEnvIdByWorkspace,
  ]);
}
