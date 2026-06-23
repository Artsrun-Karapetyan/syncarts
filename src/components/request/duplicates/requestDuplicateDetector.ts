import type {
  DuplicateRequestGroup,
  DuplicateRequestMatch,
} from "@/components/request/duplicates/requestDuplicateTypes";
import {
  getExactDuplicateKey,
  getSimilarDuplicateKey,
} from "@/components/request/duplicates/requestDuplicateUrl";
import type {
  Collection,
  Folder,
  SavedRequest,
} from "@/contexts/workspace/core/types";

export function findRequestDuplicateGroups(
  collection: Collection,
): DuplicateRequestGroup[] {
  const requests = flattenRequests(collection.items, null, []);
  return [
    ...buildGroups(requests, "exact"),
    ...buildGroups(requests, "similar").filter(hasMultipleExactUrls),
  ];
}

function flattenRequests(
  items: Array<Folder | SavedRequest>,
  folderId: string | null,
  folderPath: string[],
): DuplicateRequestMatch[] {
  return items.flatMap((item) => {
    if (item.type === "request") {
      return [{ request: item, folderId, folderPath: folderPath.join(" / ") }];
    }
    return flattenRequests(item.items, item.id, [...folderPath, item.name]);
  });
}

function buildGroups(
  requests: DuplicateRequestMatch[],
  kind: "exact" | "similar",
): DuplicateRequestGroup[] {
  const groups = new Map<string, DuplicateRequestMatch[]>();
  for (const match of requests) {
    const key =
      kind === "exact"
        ? getExactDuplicateKey(match.request.method, match.request.url)
        : getSimilarDuplicateKey(match.request.method, match.request.url);
    groups.set(key, [...(groups.get(key) || []), match]);
  }

  return Array.from(groups.entries())
    .filter(([, matches]) => matches.length > 1)
    .map(([key, matches]) => ({ key, kind, requests: matches }));
}

function hasMultipleExactUrls(group: DuplicateRequestGroup) {
  const exactKeys = new Set(
    group.requests.map((match) =>
      getExactDuplicateKey(match.request.method, match.request.url),
    ),
  );
  return exactKeys.size > 1;
}
