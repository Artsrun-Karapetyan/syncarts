import type { SavedExample, TabData } from "../core/types";

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
    pathVariables: example.originalRequest?.pathVariables,
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
