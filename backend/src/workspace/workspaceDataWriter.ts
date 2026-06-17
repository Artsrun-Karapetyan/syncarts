import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import type { WorkspaceData, WorkspaceDataClient } from "./workspaceData.js";

export async function replaceWorkspaceData(
  client: WorkspaceDataClient,
  workspaceId: string,
  data: WorkspaceData,
) {
  await client.workspaceGlobalVariable.deleteMany({ where: { workspaceId } });
  await client.workspaceEnvironment.deleteMany({ where: { workspaceId } });
  await client.workspaceCollection.deleteMany({ where: { workspaceId } });

  for (const [index, collection] of data.collections.entries()) {
    await writeCollection(client, workspaceId, collection, index);
  }

  for (const [index, environment] of data.environments.entries()) {
    await writeEnvironment(client, workspaceId, environment, index);
  }

  for (const [index, variable] of data.globalVariables.entries()) {
    await writeGlobalVariable(client, workspaceId, variable, index);
  }
}

async function writeCollection(
  client: WorkspaceDataClient,
  workspaceId: string,
  collection: any,
  sortOrder: number,
) {
  const collectionId = entityId(collection.id);

  await client.workspaceCollection.create({
    data: {
      id: collectionId,
      workspaceId,
      name: String(collection.name || "Collection"),
      sortOrder,
      authType: optionalString(collection.authType),
      bearerToken: optionalString(collection.bearerToken),
      description: optionalString(collection.description),
      preRequestScript: optionalString(collection.preRequestScript),
      testScript: optionalString(collection.testScript),
      variables: toJson(collection.variables),
      fork: toJson(collection.fork),
    },
  });

  await writeItems(client, workspaceId, collectionId, null, collection.items);
}

async function writeItems(
  client: WorkspaceDataClient,
  workspaceId: string,
  collectionId: string,
  parentFolderId: string | null,
  items: unknown,
) {
  if (!Array.isArray(items)) return;

  for (const [index, item] of items.entries()) {
    if (item?.type === "folder") {
      await writeFolder(
        client,
        workspaceId,
        collectionId,
        parentFolderId,
        item,
        index,
      );
    } else if (item?.type === "request") {
      await writeRequest(
        client,
        workspaceId,
        collectionId,
        parentFolderId,
        item,
        index,
      );
    }
  }
}

async function writeFolder(
  client: WorkspaceDataClient,
  workspaceId: string,
  collectionId: string,
  parentFolderId: string | null,
  folder: any,
  sortOrder: number,
) {
  const folderId = entityId(folder.id);

  await client.workspaceFolder.create({
    data: {
      id: folderId,
      workspaceId,
      collectionId,
      parentFolderId,
      name: String(folder.name || "Folder"),
      sortOrder,
      authType: optionalString(folder.authType),
      bearerToken: optionalString(folder.bearerToken),
      description: optionalString(folder.description),
      preRequestScript: optionalString(folder.preRequestScript),
      testScript: optionalString(folder.testScript),
      variables: toJson(folder.variables),
    },
  });

  await writeItems(client, workspaceId, collectionId, folderId, folder.items);
}

async function writeRequest(
  client: WorkspaceDataClient,
  workspaceId: string,
  collectionId: string,
  folderId: string | null,
  request: any,
  sortOrder: number,
) {
  const requestId = entityId(request.id);

  await client.workspaceRequest.create({
    data: {
      id: requestId,
      workspaceId,
      collectionId,
      folderId,
      name: String(request.name || "Request"),
      sortOrder,
      method: String(request.method || "GET"),
      url: String(request.url || ""),
      headers: toJson(request.headers ?? []),
      authType: optionalString(request.authType),
      bearerToken: optionalString(request.bearerToken),
      bodyType: optionalString(request.bodyType),
      description: optionalString(request.description),
      pathVariables: toJson(request.pathVariables),
      queryParamDescriptions: toJson(request.queryParamDescriptions),
      queryParams: toJson(request.queryParams),
      formData: toJson(request.formData),
      body: String(request.body || ""),
      preRequestScript: optionalString(request.preRequestScript),
      testScript: optionalString(request.testScript),
    },
  });

  if (!Array.isArray(request.examples)) return;
  for (const [index, example] of request.examples.entries()) {
    await client.requestExample.create({
      data: {
        id: entityId(example.id),
        requestId,
        name: String(example.name || "Example"),
        sortOrder: index,
        originalRequest: toJson(example.originalRequest),
        code: Number(example.code || 0),
        status: String(example.status || ""),
        body: String(example.body || ""),
        headers: toJson(example.headers ?? []),
      },
    });
  }
}

async function writeEnvironment(
  client: WorkspaceDataClient,
  workspaceId: string,
  environment: any,
  sortOrder: number,
) {
  await client.workspaceEnvironment.create({
    data: {
      id: entityId(environment.id),
      workspaceId,
      name: String(environment.name || "Environment"),
      sortOrder,
      variables: {
        create: Array.isArray(environment.variables)
          ? environment.variables.map((variable: any, index: number) => ({
              ...mapVariableForWrite(variable),
              sortOrder: index,
            }))
          : [],
      },
    },
  });
}

async function writeGlobalVariable(
  client: WorkspaceDataClient,
  workspaceId: string,
  variable: any,
  sortOrder: number,
) {
  await client.workspaceGlobalVariable.create({
    data: {
      ...mapVariableForWrite(variable),
      workspaceId,
      sortOrder,
    },
  });
}

function mapVariableForWrite(variable: any) {
  return {
    id: entityId(variable.id),
    key: String(variable.key || ""),
    value: String(variable.value || ""),
    enabled: variable.enabled !== false,
  };
}

function entityId(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : randomUUID();
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue);
}
