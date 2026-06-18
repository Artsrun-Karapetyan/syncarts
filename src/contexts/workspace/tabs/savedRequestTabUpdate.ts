import type { SavedRequest, TabData } from "../core/types";

export function createSavedRequestTabUpdate(
  request: SavedRequest,
  collectionId: string,
  folderId: string | null,
  savedRequestId = request.id,
): Partial<TabData> {
  return {
    name: request.name,
    method: request.method,
    url: request.url,
    headers: request.headers,
    authType: request.authType,
    bearerToken: request.bearerToken,
    bodyType: request.bodyType,
    pathVariables: request.pathVariables,
    queryParamDescriptions: request.queryParamDescriptions,
    queryParams: request.queryParams,
    formData: request.formData,
    description: request.description,
    preRequestScript: request.preRequestScript,
    testScript: request.testScript,
    body: request.body,
    collectionId,
    folderId: folderId || undefined,
    savedRequestId,
  };
}
