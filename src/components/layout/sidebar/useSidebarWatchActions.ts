import { useWorkspaceWatches } from "../../watch/useWorkspaceWatches";

export function useSidebarWatchActions(
  activeWorkspaceId: string | null | undefined,
  showToast: (message: string) => void,
) {
  const watches = useWorkspaceWatches(activeWorkspaceId);

  const handleToggleWorkspaceWatch = () => {
    if (!activeWorkspaceId) return;
    void watches
      .toggleWatch("workspace", activeWorkspaceId)
      .then((enabled) =>
        showToast(`${enabled ? "Watching" : "Unwatched"} workspace`),
      )
      .catch((error) => showToast(error.message || "Watch update failed"));
  };

  const isWorkspaceWatched = activeWorkspaceId
    ? watches.isWatched("workspace", activeWorkspaceId)
    : false;

  return { handleToggleWorkspaceWatch, isWorkspaceWatched, watches };
}
