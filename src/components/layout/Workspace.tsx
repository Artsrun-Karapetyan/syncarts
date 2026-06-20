import { useEffect, useRef, useState } from "react";

import { CollectionFolderTabs } from "@/components/layout/CollectionFolderTabs";
import { saveResponseToFile } from "@/components/layout/responseFile";
import { TabsBar } from "@/components/layout/TabsBar";
import { WorkspaceEmptyState } from "@/components/layout/workspace/WorkspaceEmptyState";
import { WorkspaceRequestHeader } from "@/components/layout/workspace/WorkspaceRequestHeader";
import { WorkspaceRequestPanels } from "@/components/layout/workspace/WorkspaceRequestPanels";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function Workspace() {
  const {
    sendRequest,
    isMutating,
    activeTab,
    tabs,
    collections,
    updateActiveTab,
    saveActiveRequestInPlace,
    saveRequestTabInPlace,
    addTab,
    closeTab,
    setActiveTabId,
    isTabDirty,
    workspaces,
  } = useWorkspace();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(
    null,
  );
  const [isCloseSaveFlow, setIsCloseSaveFlow] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [preferredSplitDirection, setPreferredSplitDirection] = useState<
    "horizontal" | "vertical"
  >(() => {
    return window.localStorage.getItem("syncarts-request-response-split") ===
      "vertical"
      ? "vertical"
      : "horizontal";
  });
  const [isNarrowLayout, setIsNarrowLayout] = useState(false);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const sendMenuRef = useRef<HTMLDivElement>(null);
  const splitDirection = isNarrowLayout ? "vertical" : preferredSplitDirection;

  const handleDirectSave = () => {
    if (!saveActiveRequestInPlace()) {
      setShowSaveDialog(true);
    }
  };

  const requestCloseTab = (tabId: string) => {
    const tab = tabs.find((item) => item.id === tabId);
    if (!tab || !isTabDirty(tab)) {
      closeTab(tabId);
      return;
    }

    setPendingCloseTabId(tabId);
    setShowCloseDialog(true);
  };

  const closePendingTab = () => {
    if (!pendingCloseTabId) return;
    closeTab(pendingCloseTabId);
    setPendingCloseTabId(null);
    setShowCloseDialog(false);
    setShowSaveDialog(false);
    setIsCloseSaveFlow(false);
  };

  const discardPendingTab = () => {
    closePendingTab();
  };

  const savePendingTab = () => {
    if (!pendingCloseTabId) return;
    const tab = tabs.find((item) => item.id === pendingCloseTabId);
    if (!tab) {
      closePendingTab();
      return;
    }

    if (saveRequestTabInPlace(tab)) {
      closePendingTab();
      return;
    }

    setActiveTabId(tab.id);
    setShowCloseDialog(false);
    setIsCloseSaveFlow(true);
    setShowSaveDialog(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (activeTab?.id) {
          requestCloseTab(activeTab.id);
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();

        // If it's a request (not a folder/collection view)
        if (!activeTab || activeTab.type === "request") {
          if (e.shiftKey) {
            setShowSaveDialog(true);
          } else {
            handleDirectSave();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, collections, requestCloseTab]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const updateLayout = () => setIsNarrowLayout(media.matches);

    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (!showSendMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (sendMenuRef.current?.contains(event.target as Node)) return;
      setShowSendMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSendMenu(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSendMenu]);

  const toggleSplitDirection = () => {
    setPreferredSplitDirection((current) => {
      const next = current === "horizontal" ? "vertical" : "horizontal";
      window.localStorage.setItem("syncarts-request-response-split", next);
      return next;
    });
  };

  const handleSendAndDownload = async () => {
    setShowSendMenu(false);
    const response = await sendRequest();
    if (!response) return;
    await saveResponseToFile(response);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <TabsBar onRequestCloseTab={requestCloseTab} />

      {workspaces.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "var(--text-secondary)",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Welcome to SyncArts
          </div>
          <div style={{ fontSize: 14 }}>
            Create a Local Folder workspace to get started, or sign in to use
            Cloud Sync.
          </div>
          <button
            className="btn btn-primary"
            onClick={() =>
              document
                .querySelector<HTMLButtonElement>(
                  '.select-container [role="button"]',
                )
                ?.click()
            }
          >
            Create Workspace
          </button>
        </div>
      ) : !activeTab ? (
        <WorkspaceEmptyState onAddTab={(data) => addTab(data)} />
      ) : activeTab.type === "request" ||
        activeTab.type === "example" ||
        !activeTab.type ? (
        <>
          <WorkspaceRequestHeader
            activeTab={activeTab}
            closeTab={closeTab}
            discardPendingTab={discardPendingTab}
            handleDirectSave={handleDirectSave}
            handleSendAndDownload={handleSendAndDownload}
            isCloseSaveFlow={isCloseSaveFlow}
            isMutating={isMutating}
            pendingCloseTabId={pendingCloseTabId}
            saveBtnRef={saveBtnRef}
            savePendingTab={savePendingTab}
            sendMenuRef={sendMenuRef}
            sendRequest={sendRequest}
            setIsCloseSaveFlow={setIsCloseSaveFlow}
            setPendingCloseTabId={setPendingCloseTabId}
            setShowCloseDialog={setShowCloseDialog}
            setShowCodeModal={setShowCodeModal}
            setShowSaveDialog={setShowSaveDialog}
            setShowSendMenu={setShowSendMenu}
            showCloseDialog={showCloseDialog}
            showCodeModal={showCodeModal}
            showSaveDialog={showSaveDialog}
            showSendMenu={showSendMenu}
            splitDirection={splitDirection}
            tabs={tabs}
            toggleSplitDirection={toggleSplitDirection}
            updateActiveTab={updateActiveTab}
          />
          <WorkspaceRequestPanels splitDirection={splitDirection} />
        </>
      ) : (
        <CollectionFolderTabs />
      )}
    </div>
  );
}
