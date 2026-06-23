import type { CollectionHealthIssueCode } from "@/components/request/health/collectionHealthTypes";

export function getCollectionHealthIssueTargetTab(
  code: CollectionHealthIssueCode,
) {
  if (code === "no-docs") return "docs";
  if (code === "no-tests") return "scripts";
  if (code === "missing-variable") return "params";
  return null;
}
