import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";

import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface GitBranch {
  name: string;
  is_remote: boolean;
}

export interface GitSyncStatus {
  ahead: number;
  behind: number;
  upstream: string | null;
}

export function useWorkspaceGit(propWorkspacePath?: string) {
  const { activeWorkspaceId, workspaces } = useWorkspace();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const contextPath =
    activeWorkspace?.type === "local" ? activeWorkspace.path : null;
  const workspacePath = propWorkspacePath || contextPath;

  const [isGitRepo, setIsGitRepo] = useState<boolean>(false);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<GitSyncStatus | null>(null);

  const fetchGitState = useCallback(async () => {
    if (!workspacePath) {
      setIsGitRepo(false);
      setCurrentBranch(null);
      setBranches([]);
      return;
    }

    setIsLoading(true);
    try {
      const isRepo: boolean = await invoke("git_check_repo", {
        path: workspacePath,
      });
      setIsGitRepo(isRepo);

      if (isRepo) {
        const [current, branchesList]: [string, GitBranch[]] =
          await Promise.all([
            invoke<string>("git_get_current_branch", { path: workspacePath }),
            invoke<GitBranch[]>("git_get_branches", { path: workspacePath }),
          ]);
        setCurrentBranch(current);
        setBranches(branchesList);
      } else {
        setCurrentBranch(null);
        setBranches([]);
      }
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch git state:", err);
      setIsGitRepo(false);
      setError(err?.toString() || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [workspacePath]);

  // Fetch when path changes or on window focus
  useEffect(() => {
    fetchGitState();

    const onFocus = () => fetchGitState();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchGitState]);

  const refreshSyncStatus = useCallback(
    async (doFetch: boolean = false) => {
      if (!workspacePath || !isGitRepo) return;
      setIsSyncing(true);
      try {
        const status: GitSyncStatus = await invoke("git_get_sync_status", {
          path: workspacePath,
          doFetch,
        });
        setSyncStatus(status);
      } catch (err) {
        console.error("Failed to fetch git sync status", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [workspacePath, isGitRepo],
  );

  useEffect(() => {
    if (isGitRepo) {
      // Instant local check on branch change, no network fetch
      refreshSyncStatus(false);
    }
  }, [isGitRepo, currentBranch, refreshSyncStatus]);

  const checkoutBranch = useCallback(
    async (branch: string) => {
      if (!workspacePath || !isGitRepo) return false;

      setIsCheckingOut(true);
      setError(null);
      try {
        await invoke("git_checkout_branch", { path: workspacePath, branch });
        await fetchGitState(); // Refresh after checkout
        return true;
      } catch (err: any) {
        console.error("Failed to checkout branch:", err);
        setError(err?.toString() || "Checkout failed");
        return false;
      } finally {
        setIsCheckingOut(false);
      }
    },
    [workspacePath, isGitRepo, fetchGitState],
  );

  const pullChanges = useCallback(async () => {
    if (!workspacePath || !isGitRepo) return false;
    setIsSyncing(true);
    setError(null);
    try {
      await invoke("git_pull", { path: workspacePath });
      await refreshSyncStatus();
      return true;
    } catch (err: any) {
      console.error("Failed to pull:", err);
      setError(err?.toString() || "Pull failed");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [workspacePath, isGitRepo, refreshSyncStatus]);

  const pushChanges = useCallback(async () => {
    if (!workspacePath || !isGitRepo) return false;
    setIsSyncing(true);
    setError(null);
    try {
      await invoke("git_push", { path: workspacePath });
      await refreshSyncStatus();
      return true;
    } catch (err: any) {
      console.error("Failed to push:", err);
      setError(err?.toString() || "Push failed");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [workspacePath, isGitRepo, refreshSyncStatus]);

  return {
    isGitRepo,
    currentBranch,
    branches,
    isLoading,
    isCheckingOut,
    isSyncing,
    error,
    syncStatus,
    checkoutBranch,
    pullChanges,
    pushChanges,
    refreshSyncStatus,
    refresh: fetchGitState,
  };
}
