export const WorkspaceEventTypes = {
  WorkspaceUpdated: "workspace.updated",
  CollectionCreated: "collection.created",
  CollectionUpdated: "collection.updated",
  CollectionDeleted: "collection.deleted",
  FolderCreated: "folder.created",
  FolderUpdated: "folder.updated",
  FolderDeleted: "folder.deleted",
  RequestCreated: "request.created",
  RequestUpdated: "request.updated",
  RequestDeleted: "request.deleted",
  ExampleCreated: "example.created",
  ExampleUpdated: "example.updated",
  ExampleDeleted: "example.deleted",
  EnvironmentCreated: "environment.created",
  EnvironmentUpdated: "environment.updated",
  EnvironmentDeleted: "environment.deleted",
  EnvironmentVariableUpdated: "environmentVariable.updated",
  GlobalVariablesUpdated: "globalVariables.updated",
} as const;

export type WorkspaceEventType =
  (typeof WorkspaceEventTypes)[keyof typeof WorkspaceEventTypes];

export type WorkspaceEntityType =
  | "workspace"
  | "collection"
  | "folder"
  | "request"
  | "example"
  | "environment"
  | "environmentVariable"
  | "globalVariables";

export type WorkspaceRealtimeEvent = {
  type: WorkspaceEventType;
  workspaceId: string;
  entityType: WorkspaceEntityType;
  entityId?: string;
  parentId?: string;
  version?: number;
  workspaceVersion?: number;
  updatedAt?: string;
};
