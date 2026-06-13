import type { TabData } from "../core/types";

export function createTab(
  data?: Partial<TabData> & { savedRequestId?: string },
) {
  const isReq = !data?.type || data.type === "request";
  const newTab: TabData = {
    id: crypto.randomUUID(),
    type: data?.type || "request",
    name: data?.name || "Untitled Request",
    method: isReq ? "GET" : "",
    url: isReq ? "" : "",
    headers: isReq ? [{ key: "", value: "", enabled: true }] : [],
    bodyType: isReq ? "raw" : undefined,
    queryParams: isReq ? [] : undefined,
    formData: isReq
      ? [
          {
            id: crypto.randomUUID(),
            key: "",
            value: "",
            enabled: true,
            type: "text",
          },
        ]
      : undefined,
    pathVariables: isReq ? [] : undefined,
    body: isReq ? "" : "",
    description: "",
    preRequestScript: "",
    testScript: "",
    response: null,
    ...data,
  };
  if (!newTab.savedRequestId && data?.id && data.id !== newTab.id) {
    newTab.savedRequestId = data.id;
  }
  return newTab;
}
