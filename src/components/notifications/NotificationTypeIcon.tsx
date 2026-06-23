import {
  Bell,
  GitPullRequest,
  Info,
  RefreshCcw,
  UserPlus,
  Users,
} from "lucide-react";

type NotificationTypeIconProps = {
  type: string;
};

export function NotificationTypeIcon({ type }: NotificationTypeIconProps) {
  const size = 16;

  if (type.includes("INVITE")) return <UserPlus size={size} />;
  if (type.includes("MEMBER")) return <Users size={size} />;
  if (type.includes("MERGE_REQUEST")) return <GitPullRequest size={size} />;
  if (type.includes("SYNC") || type.includes("PULL")) {
    return <RefreshCcw size={size} />;
  }
  if (type.includes("UPDATE")) return <Info size={size} />;

  return <Bell size={size} />;
}
