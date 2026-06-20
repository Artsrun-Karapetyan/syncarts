import type { SavedExample, TabData } from "@/contexts/workspace/core/types";

export function createExampleTabData(
  collectionId: string,
  example: SavedExample,
): Partial<TabData> {
  return {
    type: "example",
    name: example.name,
    collectionId,
    exampleId: example.id,
    method: example.originalRequest?.method || "GET",
    url: example.originalRequest?.url || "",
    authType: example.originalRequest?.authType,
    bearerToken: example.originalRequest?.bearerToken,
    description: example.originalRequest?.description,
    pathVariables: example.originalRequest?.pathVariables,
    queryParamDescriptions: example.originalRequest?.queryParamDescriptions,
    queryParams: example.originalRequest?.queryParams,
    preRequestScript: example.originalRequest?.preRequestScript,
    testScript: example.originalRequest?.testScript,
    body: example.originalRequest?.body || "",
    bodyType: example.originalRequest?.bodyType || "none",
    formData: example.originalRequest?.formData,
    headers: example.originalRequest?.headers || [],
    response: {
      status: example.code,
      status_text: example.status,
      headers: example.headers.reduce(
        (acc, header) => ({ ...acc, [header.key]: header.value }),
        {},
      ),
      body: example.body,
      time_ms: 0,
    },
  };
}
