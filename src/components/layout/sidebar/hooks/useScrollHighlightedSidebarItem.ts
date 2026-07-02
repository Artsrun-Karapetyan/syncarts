import { type RefObject, useEffect } from "react";

import { scrollRowIntoViewVertically } from "@/components/layout/sidebar/hooks/scrollRowIntoViewVertically";

interface Args {
  highlightedCollectionId: string | null;
  highlightedExampleId: string | null;
  highlightedFolderId: string | null;
  highlightedRequestId: string | null;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function useScrollHighlightedSidebarItem(args: Args) {
  const {
    highlightedCollectionId,
    highlightedExampleId,
    highlightedFolderId,
    highlightedRequestId,
    scrollContainerRef,
  } = args;

  useEffect(() => {
    const target =
      getTarget("example", highlightedExampleId) ||
      getTarget("request", highlightedRequestId) ||
      getTarget("folder", highlightedFolderId) ||
      getTarget("collection", highlightedCollectionId);
    if (!target) return;

    const frame = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const row = findSidebarRow(container, target);
      scrollRowIntoViewVertically(container, row ?? null);
    });

    return () => cancelAnimationFrame(frame);
  }, [
    highlightedCollectionId,
    highlightedExampleId,
    highlightedFolderId,
    highlightedRequestId,
    scrollContainerRef,
  ]);
}

function getTarget(kind: string, id: string | null) {
  return id ? { kind, id } : null;
}

function findSidebarRow(
  root: HTMLDivElement | null,
  target: { kind: string; id: string },
) {
  if (!root) return null;
  return Array.from(
    root.querySelectorAll<HTMLElement>(`[data-sidebar-kind="${target.kind}"]`),
  ).find((element) => element.dataset.sidebarId === target.id);
}
