import type { TabData } from "@/contexts/workspace/core/types";

export function reorderTabs(
  tabs: TabData[],
  sourceId: string,
  targetId: string,
  position: "before" | "after",
) {
  if (sourceId === targetId) return tabs;
  const sourceIndex = tabs.findIndex((tab) => tab.id === sourceId);
  const targetIndex = tabs.findIndex((tab) => tab.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return tabs;

  const nextTabs = [...tabs];
  const [sourceTab] = nextTabs.splice(sourceIndex, 1);
  const nextTargetIndex = nextTabs.findIndex((tab) => tab.id === targetId);
  nextTabs.splice(
    position === "after" ? nextTargetIndex + 1 : nextTargetIndex,
    0,
    sourceTab,
  );
  return nextTabs;
}
