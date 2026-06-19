export interface AppUpdateMetadata {
  version: string;
  currentVersion: string;
  body?: string | null;
  date?: string | null;
}

export type AppUpdateStatus = "idle" | "checking" | "available" | "installing";
