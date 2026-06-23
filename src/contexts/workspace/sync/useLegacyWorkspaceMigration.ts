import { useEffect } from "react";

import type { TabData, Workspace } from "@/contexts/workspace/core/types";
import { normalizeLegacyWorkspaces } from "@/contexts/workspace/sync/syncHelpers";

type SetValue<T> = (value: T | ((val: T) => T)) => void;

interface MigrationArgs {
  activeWorkspaceId: string;
  localDefaultWorkspaceId: string;
  storageHydrated: boolean;
  userId: string;
  setActiveWorkspaceId: SetValue<string>;
  setActiveEnvIdByWorkspace: SetValue<Record<string, string | null>>;
  setActiveTabIdByWorkspace: SetValue<Record<string, string | null>>;
  setTabsByWorkspace: SetValue<Record<string, TabData[]>>;
  setWorkspaces: SetValue<Workspace[]>;
  workspaces: Workspace[];
}

export function useLegacyWorkspaceMigration(args: MigrationArgs) {
  const {
    activeWorkspaceId,
    localDefaultWorkspaceId,
    setActiveWorkspaceId,
    setActiveEnvIdByWorkspace,
    setActiveTabIdByWorkspace,
    setTabsByWorkspace,
    setWorkspaces,
    storageHydrated,
    userId,
    workspaces,
  } = args;

  useEffect(() => {
    if (!storageHydrated) return;

    setWorkspaces((prev) => {
      const normalized = normalizeLegacyWorkspaces(
        prev,
        localDefaultWorkspaceId,
        userId,
      );
      if (normalized.length !== prev.length) return normalized;
      if (!prev.some((workspace) => workspace.id === "default")) return prev;
      if (prev.some((workspace) => workspace.id === localDefaultWorkspaceId)) {
        return prev.filter((workspace) => workspace.id !== "default");
      }

      return prev.map((workspace) =>
        workspace.id === "default" &&
        (!workspace.ownerId || workspace.ownerId === userId)
          ? { ...workspace, id: localDefaultWorkspaceId }
          : workspace,
      );
    });

    setTabsByWorkspace((prev) => {
      if (!prev.default || prev[localDefaultWorkspaceId]) return prev;
      const { default: defaultTabs, ...rest } = prev;
      return { ...rest, [localDefaultWorkspaceId]: defaultTabs };
    });

    setActiveTabIdByWorkspace((prev) => {
      if (
        !Object.prototype.hasOwnProperty.call(prev, "default") ||
        prev[localDefaultWorkspaceId] !== undefined
      )
        return prev;
      const { default: defaultActiveTabId, ...rest } = prev;
      return { ...rest, [localDefaultWorkspaceId]: defaultActiveTabId };
    });

    setActiveEnvIdByWorkspace((prev) => {
      if (
        !Object.prototype.hasOwnProperty.call(prev, "default") ||
        prev[localDefaultWorkspaceId] !== undefined
      )
        return prev;
      const { default: defaultActiveEnvId, ...rest } = prev;
      return { ...rest, [localDefaultWorkspaceId]: defaultActiveEnvId };
    });

    if (activeWorkspaceId === "default") {
      setActiveWorkspaceId(localDefaultWorkspaceId);
    }
  }, [
    activeWorkspaceId,
    localDefaultWorkspaceId,
    setActiveEnvIdByWorkspace,
    setActiveTabIdByWorkspace,
    setActiveWorkspaceId,
    setTabsByWorkspace,
    setWorkspaces,
    storageHydrated,
    userId,
  ]);

  useEffect(() => {
    if (!storageHydrated) return;

    if (
      workspaces.length > 0 &&
      !workspaces.some((workspace) => workspace.id === activeWorkspaceId)
    ) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [activeWorkspaceId, setActiveWorkspaceId, storageHydrated, workspaces]);
}
