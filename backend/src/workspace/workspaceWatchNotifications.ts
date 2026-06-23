import { WatchService } from "../watch/watch.service.js";
import { WatchEntityTypes } from "../watch/watchTypes.js";

export async function notifyWorkspaceWatchers(input: {
  watches?: WatchService;
  workspaceId: string;
  userId: string;
}) {
  if (!input.watches) return;

  try {
    await input.watches.notifyWatchers({
      workspaceId: input.workspaceId,
      actorId: input.userId,
      entityType: WatchEntityTypes.Workspace,
      entityId: input.workspaceId,
      type: "WATCHED_WORKSPACE_UPDATED",
      title: "Watched workspace updated",
      message: "Workspace data was synced",
      actionUrl: "/",
      metadata: { workspaceId: input.workspaceId },
    });
  } catch (error) {
    console.warn("Failed to create workspace watch notification", error);
  }
}
