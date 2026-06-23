import { useEffect } from "react";

import type { TabData } from "@/contexts/WorkspaceContext";

interface UseActiveTabSidebarHighlightArgs {
  activeTab: TabData | undefined;
  activeTabId: string | null;
  resolveTabSavedRequestId: (tab?: TabData) => string | undefined;
}

export function useActiveTabSidebarHighlight(
  args: UseActiveTabSidebarHighlightArgs,
) {
  useEffect(() => {
    if (args.activeTab?.type === "example" && args.activeTab.exampleId) {
      window.dispatchEvent(
        new CustomEvent("highlight-sidebar", {
          detail: { exampleId: args.activeTab.exampleId },
        }),
      );
      return;
    }

    const savedRequestId = args.resolveTabSavedRequestId(args.activeTab);
    if (!savedRequestId) return;
    window.dispatchEvent(
      new CustomEvent("highlight-sidebar", { detail: { savedRequestId } }),
    );
  }, [args.activeTabId, args.activeTab, args.resolveTabSavedRequestId]);
}
