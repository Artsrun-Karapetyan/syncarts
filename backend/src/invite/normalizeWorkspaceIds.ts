export function normalizeWorkspaceIds(body: {
  workspaceId?: string;
  workspaceIds?: string[];
}) {
  return body.workspaceIds?.filter(Boolean).length
    ? body.workspaceIds.filter(Boolean)
    : body.workspaceId
      ? [body.workspaceId]
      : [];
}
