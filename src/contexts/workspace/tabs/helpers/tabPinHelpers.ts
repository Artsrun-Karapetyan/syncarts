import type { TabData } from "@/contexts/workspace/core/types";

export function sortPinnedTabs(tabs: TabData[]) {
  return [
    ...tabs.filter((tab) => tab.pinned),
    ...tabs.filter((tab) => !tab.pinned),
  ];
}

export function toggleTabPinned(tabs: TabData[], tabId: string) {
  return sortPinnedTabs(
    tabs.map((tab) =>
      tab.id === tabId ? { ...tab, pinned: !tab.pinned } : tab,
    ),
  );
}
