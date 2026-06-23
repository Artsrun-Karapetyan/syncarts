import type { TabData } from "@/contexts/workspace/core/types";

export function createTab(
  data?: Partial<TabData> & { savedRequestId?: string },
) {
  const isReq = !data?.type || data.type === "request";
  const isNew = !data?.id && !data?.savedRequestId;
  const newTab: TabData = {
    id: crypto.randomUUID(),
    type: data?.type || "request",
    name: data?.name || "Untitled Request",
    method: isReq ? "GET" : "",
    url: isReq ? "" : "",
    headers: isReq
      ? isNew
        ? [{ key: "", value: "", enabled: true }]
        : []
      : [],
    bodyType: isReq ? "raw" : undefined,
    queryParams: isReq ? [] : undefined,
    formData: isReq
      ? isNew
        ? [
            {
              id: crypto.randomUUID(),
              key: "",
              value: "",
              enabled: true,
              type: "text",
            },
          ]
        : []
      : undefined,
    pathVariables: isReq ? [] : undefined,
    body: isReq ? "" : "",
    description: "",
    preRequestScript: "",
    testScript: "",
    response: null,
    ...data,
  };
  return newTab;
}
