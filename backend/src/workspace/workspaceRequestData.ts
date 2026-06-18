import type { Prisma } from "@prisma/client";

type RequestDataClient = {
  requestExample: any;
  workspaceRequest: any;
};

export async function replaceWorkspaceRequest(
  client: RequestDataClient,
  workspaceId: string,
  requestId: string,
  input: any,
) {
  const result = await client.workspaceRequest.updateMany({
    where:
      typeof input.version === "number"
        ? { id: requestId, workspaceId, version: input.version }
        : { id: requestId, workspaceId },
    data: {
      collectionId: optionalString(input.collectionId),
      folderId: optionalString(input.folderId),
      name: String(input.name || "Request"),
      method: String(input.method || "GET"),
      url: String(input.url || ""),
      headers: toJson(input.headers ?? []),
      authType: optionalString(input.authType),
      bearerToken: optionalString(input.bearerToken),
      bodyType: optionalString(input.bodyType),
      description: optionalString(input.description),
      pathVariables: toJson(input.pathVariables),
      queryParamDescriptions: toJson(input.queryParamDescriptions),
      queryParams: toJson(input.queryParams),
      formData: toJson(input.formData),
      body: String(input.body || ""),
      preRequestScript: optionalString(input.preRequestScript),
      testScript: optionalString(input.testScript),
      version: { increment: 1 },
    },
  });

  if (result.count === 0) return null;

  await client.requestExample.deleteMany({ where: { workspaceId, requestId } });

  if (Array.isArray(input.examples)) {
    for (const [index, example] of input.examples.entries()) {
      await client.requestExample.create({
        data: {
          id: String(example.id),
          workspaceId,
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

  return client.workspaceRequest.findUnique({
    where: { workspaceId_id: { workspaceId, id: requestId } },
    include: { examples: { orderBy: { sortOrder: "asc" } } },
  });
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue);
}
