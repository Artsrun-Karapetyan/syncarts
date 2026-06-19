import { NotificationService } from "../notification/notification.service.js";
import { NotificationAudience } from "../notification/notificationTypes.js";

export async function notifyMemberAddedToWorkspaces(input: {
  notifications?: NotificationService;
  userId: string;
  ownerId: string;
  workspaces: Array<{
    id: string;
    name: string;
    owner: { name: string; email?: string | null };
  }>;
}) {
  if (!input.notifications || input.workspaces.length === 0) return;

  try {
    await input.notifications.createNotifications(
      input.workspaces.map((workspace) => ({
        userId: input.userId,
        workspaceId: workspace.id,
        type: "WORKSPACE_INVITE_RECEIVED",
        audience: NotificationAudience.Direct,
        title: "Workspace invite received",
        message: `${workspace.owner.name} added you to ${workspace.name}`,
        entityType: "workspace",
        entityId: workspace.id,
        actorId: input.ownerId,
        actorName: workspace.owner.name,
        actionUrl: "/",
        actionLabel: "Open",
        metadata: { workspaceId: workspace.id },
      })),
    );
  } catch (error) {
    console.warn("Failed to create invite notification", error);
  }
}
