import type { WorkspaceData, WorkspaceDataClient } from "./workspaceData.js";

export async function readWorkspaceData(
  client: WorkspaceDataClient,
  workspaceId: string,
): Promise<WorkspaceData> {
  const [collections, environments, globalVariables] = await Promise.all([
    readCollections(client, workspaceId),
    readEnvironments(client, workspaceId),
    readGlobalVariables(client, workspaceId),
  ]);

  return { collections, environments, globalVariables };
}

async function readCollections(
  client: WorkspaceDataClient,
  workspaceId: string,
) {
  const collections = await client.workspaceCollection.findMany({
    where: { workspaceId },
    orderBy: { sortOrder: "asc" },
    include: {
      folders: { orderBy: { sortOrder: "asc" } },
      requests: {
        orderBy: { sortOrder: "asc" },
        include: { examples: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  return collections.map((collection: any) => ({
    id: collection.id,
    name: collection.name,
    createdAt: serializeDate(collection.createdAt),
    updatedAt: serializeDate(collection.updatedAt),
    version: collection.version,
    items: buildCollectionItems(collection, null),
    authType: collection.authType ?? undefined,
    bearerToken: collection.bearerToken ?? undefined,
    description: collection.description ?? undefined,
    preRequestScript: collection.preRequestScript ?? undefined,
    testScript: collection.testScript ?? undefined,
    variables: fromJson(collection.variables),
    fork: fromJson(collection.fork),
  }));
}

function buildCollectionItems(collection: any, parentFolderId: string | null) {
  const folders = collection.folders
    .filter((folder: any) => (folder.parentFolderId ?? null) === parentFolderId)
    .map((folder: any) => ({
      sortOrder: folder.sortOrder,
      item: {
        id: folder.id,
        type: "folder",
        name: folder.name,
        createdAt: serializeDate(folder.createdAt),
        updatedAt: serializeDate(folder.updatedAt),
        version: folder.version,
        items: buildCollectionItems(collection, folder.id),
        authType: folder.authType ?? undefined,
        bearerToken: folder.bearerToken ?? undefined,
        description: folder.description ?? undefined,
        preRequestScript: folder.preRequestScript ?? undefined,
        testScript: folder.testScript ?? undefined,
        variables: fromJson(folder.variables),
      },
    }));

  const requests = collection.requests
    .filter((request: any) => (request.folderId ?? null) === parentFolderId)
    .map((request: any) => ({
      sortOrder: request.sortOrder,
      item: mapWorkspaceRequest(request),
    }));

  return [...folders, ...requests]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ item }) => item);
}

export function mapWorkspaceRequest(request: any) {
  return {
    type: "request",
    id: request.id,
    collectionId: request.collectionId,
    folderId: request.folderId ?? undefined,
    name: request.name,
    createdAt: serializeDate(request.createdAt),
    updatedAt: serializeDate(request.updatedAt),
    version: request.version,
    method: request.method,
    url: request.url,
    headers: fromJson(request.headers) ?? [],
    authType: request.authType ?? undefined,
    bearerToken: request.bearerToken ?? undefined,
    bodyType: request.bodyType ?? undefined,
    description: request.description ?? undefined,
    pathVariables: fromJson(request.pathVariables),
    queryParamDescriptions: fromJson(request.queryParamDescriptions),
    queryParams: fromJson(request.queryParams),
    formData: fromJson(request.formData),
    body: request.body,
    preRequestScript: request.preRequestScript ?? undefined,
    testScript: request.testScript ?? undefined,
    examples: request.examples.map((example: any) => ({
      id: example.id,
      name: example.name,
      createdAt: serializeDate(example.createdAt),
      updatedAt: serializeDate(example.updatedAt),
      version: example.version,
      originalRequest: fromJson(example.originalRequest),
      code: example.code,
      status: example.status,
      body: example.body,
      headers: fromJson(example.headers) ?? [],
    })),
  };
}

async function readEnvironments(
  client: WorkspaceDataClient,
  workspaceId: string,
) {
  const environments = await client.workspaceEnvironment.findMany({
    where: { workspaceId },
    orderBy: { sortOrder: "asc" },
    include: { variables: { orderBy: { sortOrder: "asc" } } },
  });

  return environments.map((environment: any) => ({
    id: environment.id,
    name: environment.name,
    createdAt: serializeDate(environment.createdAt),
    updatedAt: serializeDate(environment.updatedAt),
    version: environment.version,
    variables: environment.variables.map(mapVariable),
  }));
}

async function readGlobalVariables(
  client: WorkspaceDataClient,
  workspaceId: string,
) {
  const variables = await client.workspaceGlobalVariable.findMany({
    where: { workspaceId },
    orderBy: { sortOrder: "asc" },
  });

  return variables.map(mapVariable);
}

function mapVariable(variable: any) {
  return {
    id: variable.id,
    key: variable.key,
    value: variable.value,
    enabled: variable.enabled,
    createdAt: serializeDate(variable.createdAt),
    updatedAt: serializeDate(variable.updatedAt),
    version: variable.version,
  };
}

function fromJson(value: unknown) {
  return value ?? undefined;
}

function serializeDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : value;
}
