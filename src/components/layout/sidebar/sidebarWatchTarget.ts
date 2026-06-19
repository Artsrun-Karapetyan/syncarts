import type { CtxMenuState } from "./types";

export function getWatchTarget(ctxMenu: CtxMenuState) {
  if (ctxMenu.itemType === "collection") {
    return {
      entityType: "collection" as const,
      entityId: ctxMenu.collectionId,
    };
  }

  if (ctxMenu.itemType === "request" && ctxMenu.itemId) {
    return { entityType: "request" as const, entityId: ctxMenu.itemId };
  }

  return null;
}
