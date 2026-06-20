import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import { api } from "../../../lib/api";
import type { TabData, Workspace } from "./types";

interface UseWorkspaceCrudActionsArgs {
  activeWorkspaceId: string;
  deletedWorkspaceIdsRef: MutableRefObject<Set<string>>;
  dirtyWorkspaceIdsRef: MutableRefObject<Set<string>>;
  lastSyncedSignaturesRef: MutableRefObject<Record<string, string>>;
  localDefaultWorkspaceId: string;
  setActiveEnvIdByWorkspace: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
  setActiveTabIdByWorkspace: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
  setActiveWorkspaceId: Dispatch<SetStateAction<string>>;
  setTabsByWorkspace: Dispatch<SetStateAction<Record<string, TabData[]>>>;
  setWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
  syncingWorkspaceIdsRef: MutableRefObject<Set<string>>;
  userId: string;
  workspaces: Workspace[];
}

export function useWorkspaceCrudActions(args: UseWorkspaceCrudActionsArgs) {
  const {
    activeWorkspaceId,
    deletedWorkspaceIdsRef,
    dirtyWorkspaceIdsRef,
    lastSyncedSignaturesRef,
    localDefaultWorkspaceId,
    setActiveEnvIdByWorkspace,
    setActiveTabIdByWorkspace,
    setActiveWorkspaceId,
    setTabsByWorkspace,
    setWorkspaces,
    syncingWorkspaceIdsRef,
    userId,
    workspaces,
  } = args;

  const createWorkspace = (
    name: string,
    collections: any[] = [],
    environments: any[] = [],
  ) => {
    const newWsId = crypto.randomUUID();
    dirtyWorkspaceIdsRef.current.add(newWsId);
    setWorkspaces((prev) => [
      ...prev,
      { id: newWsId, name, collections, environments },
    ]);
    setTabsByWorkspace((prev) => ({ ...prev, [newWsId]: [] }));
    setActiveTabIdByWorkspace((prev) => ({ ...prev, [newWsId]: null }));
    setActiveEnvIdByWorkspace((prev) => ({ ...prev, [newWsId]: null }));
    setActiveWorkspaceId(newWsId);
    return newWsId;
  };

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  const renameWorkspace = (id: string, newName: string) => {
    if (id === localDefaultWorkspaceId) {
      throw new Error("Cannot rename your default workspace.");
    }
    dirtyWorkspaceIdsRef.current.add(id);
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: newName } : w)),
    );
  };

  const removeWorkspace = async (id: string) => {
    if (id === localDefaultWorkspaceId) {
      throw new Error("Cannot delete your default workspace.");
    }
    const nextWorkspaceId =
      workspaces.find((workspace) => workspace.id !== id)?.id ||
      localDefaultWorkspaceId;
    deletedWorkspaceIdsRef.current.add(id);
    dirtyWorkspaceIdsRef.current.delete(id);
    syncingWorkspaceIdsRef.current.delete(id);
    delete lastSyncedSignaturesRef.current[id];

    try {
      await api.delete(`/workspaces/${id}`).catch((err) => {
        if (err.response?.status !== 404) throw err;
      });
    } catch (err) {
      console.error("[SYNC] DELETE failed:", err);
      deletedWorkspaceIdsRef.current.delete(id);
      throw err;
    }

    setWorkspaces((prev) => {
      const next = prev.filter((workspace) => workspace.id !== id);
      if (next.length > 0) return next;
      return [
        {
          id: localDefaultWorkspaceId,
          name: "My Workspace",
          ownerId: userId,
          collections: [],
          environments: [],
        },
      ];
    });
    setTabsByWorkspace((prev) => {
      const { [id]: _removedTabs, ...rest } = prev;
      return rest;
    });
    setActiveTabIdByWorkspace((prev) => {
      const { [id]: _removedActiveTab, ...rest } = prev;
      return rest;
    });
    setActiveEnvIdByWorkspace((prev) => {
      const { [id]: _removedActiveEnv, ...rest } = prev;
      return rest;
    });

    if (activeWorkspaceId === id) setActiveWorkspaceId(nextWorkspaceId);
  };

  return {
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
    removeWorkspace,
  };
}
