import type { Folder, SavedRequest } from "../../contexts/WorkspaceContext";

export type OpenApiTaggedRequest = SavedRequest & { tagName?: string };

export function groupOpenApiRequestsByTag(
  requests: OpenApiTaggedRequest[],
): Array<Folder | SavedRequest> {
  const rootRequests = requests
    .filter((request) => !request.tagName)
    .map(stripTagName);
  const tags = new Map<string, SavedRequest[]>();

  for (const request of requests) {
    if (!request.tagName) continue;
    const items = tags.get(request.tagName) || [];
    items.push(stripTagName(request));
    tags.set(request.tagName, items);
  }

  return [
    ...rootRequests,
    ...Array.from(tags.entries()).map(([name, items]) => ({
      type: "folder" as const,
      id: crypto.randomUUID(),
      name,
      items,
    })),
  ];
}

function stripTagName(request: OpenApiTaggedRequest): SavedRequest {
  const { tagName: _tagName, ...savedRequest } = request;
  return savedRequest;
}
