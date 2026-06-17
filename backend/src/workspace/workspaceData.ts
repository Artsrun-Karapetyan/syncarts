export type WorkspaceDataClient = {
  workspaceCollection: any;
  workspaceEnvironment: any;
  workspaceGlobalVariable: any;
  workspaceFolder: any;
  workspaceRequest: any;
  requestExample: any;
};

export type WorkspaceData = {
  collections: any[];
  environments: any[];
  globalVariables: any[];
};

export function normalizeWorkspaceData(value: unknown): WorkspaceData {
  if (typeof value !== "object" || value === null) {
    return { collections: [], environments: [], globalVariables: [] };
  }

  const input = value as Record<string, unknown>;
  return {
    collections: Array.isArray(input.collections) ? input.collections : [],
    environments: Array.isArray(input.environments) ? input.environments : [],
    globalVariables: Array.isArray(input.globalVariables)
      ? input.globalVariables
      : [],
  };
}

export { readWorkspaceData } from "./workspaceDataReader.js";
export { replaceWorkspaceData } from "./workspaceDataWriter.js";
