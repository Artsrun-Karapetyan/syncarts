import {
  ChevronDown,
  Code2,
  Download,
  Edit2,
  Loader2,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { MethodSelector } from "../request/MethodSelector";
import { RequestCodeModal } from "../request/RequestCodeModal";
import { RequestTabs } from "../request/RequestTabs";
import { SaveDialog } from "../request/SaveDialog";
import { UrlBar } from "../request/UrlBar";
import { ResponseViewer } from "../response/ResponseViewer";
import { UnsavedChangesModal } from "../ui/UnsavedChangesModal";
import { CollectionFolderTabs } from "./CollectionFolderTabs";
import { saveResponseToFile } from "./responseFile";
import { TabsBar } from "./TabsBar";

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

      {!activeTab ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              No request open
            </div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              Create a request or open one from a collection.
            </div>
            <button
              className="btn"
              style={{ marginTop: 4 }}
              onClick={() => addTab()}
            >
              New Request
            </button>
          </div>
        </div>
      ) : activeTab.type === "request" ||
        activeTab.type === "example" ||
        !activeTab.type ? (
        <>
          {/* Header & URL Bar */}
          <div
            style={{
              padding: "12px 16px 0 16px",
              flexShrink: 0,
              position: "relative",
              zIndex: 50,
            }}
          >
            {/* Top Row: Name and Save */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    maxWidth: 400,
                    width: "100%",
                  }}
                >
                  <input
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      background: "transparent",
                      border: "1px solid transparent",
                      borderRadius: 6,
                      padding: "6px 32px 6px 10px",
                      color: "var(--text-primary)",
                      outline: "none",
                      width: "100%",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    value={activeTab?.name || ""}
                    placeholder="Untitled Request"
                    onChange={(e) => updateActiveTab({ name: e.target.value })}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "var(--bg-tertiary)";
                      e.currentTarget.style.border =
                        "1px solid var(--border-color)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.border = "1px solid transparent";
                    }}
                    onMouseEnter={(e) => {
                      if (document.activeElement !== e.currentTarget)
                        e.currentTarget.style.background =
                          "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.currentTarget)
                        e.currentTarget.style.background = "transparent";
                    }}
                  />
                  <Edit2
                    size={12}
                    style={{
                      position: "absolute",
                      right: 12,
                      color: "var(--text-tertiary)",
                      pointerEvents: "none",
                      opacity: activeTab?.name ? 0.5 : 0.8,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  className="btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 12,
                    padding: "0 12px",
                    borderRadius: 6,
                    height: 28,
                    fontWeight: 600,
                    background: "transparent",
                    border: "1px solid var(--border-color)",
                  }}
                  onClick={toggleSplitDirection}
                  title={
                    splitDirection === "horizontal"
                      ? "Stack request and response"
                      : "Show request and response side by side"
                  }
                >
                  {splitDirection === "horizontal"
                    ? "Stack Layout"
                    : "Split Layout"}
                </button>

                {activeTab?.type !== "example" && (
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 6,
                      background: "var(--bg-tertiary)",
                      overflow: "hidden",
                      height: 28,
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <button
                      ref={saveBtnRef}
                      className="btn"
                      style={{
                        fontSize: 12,
                        padding: "0 16px",
                        height: "100%",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: 0,
                        background: "transparent",
                      }}
                      onClick={() => {
                        handleDirectSave();
                      }}
                    >
                      Save
                    </button>
                    <div
                      style={{
                        width: 1,
                        background: "var(--border-color)",
                        margin: "4px 0",
                      }}
                    />
                    <button
                      className="btn"
                      style={{
                        padding: "0 8px",
                        height: "100%",
                        border: "none",
                        borderRadius: 0,
                        background: "transparent",
                      }}
                      onClick={() => setShowSaveDialog((current) => !current)}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: URL Bar */}
            <div
              className="glass-panel"
              style={{
                padding: 6,
                display: "flex",
                gap: 6,
                alignItems: "center",
                borderRadius: 9999,
              }}
            >
              <MethodSelector />
              <UrlBar />
              <button
                className="btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                  padding: "0 16px",
                  borderRadius: 9999,
                  height: 34,
                  fontWeight: 700,
                }}
                onClick={() => setShowCodeModal(true)}
                title="Generate cURL"
              >
                <Code2 size={14} />
                Code
              </button>
              <div style={{ position: "relative", display: "flex" }}>
                <button
                  className="btn-success"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 13,
                    padding: "0 20px 0 24px",
                    borderRadius: "9999px 0 0 9999px",
                    height: 34,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    border: "none",
                    cursor: isMutating ? "not-allowed" : "pointer",
                    opacity: isMutating ? 0.7 : 1,
                    transition: "all var(--transition-fast)",
                  }}
                  onClick={() => {
                    void sendRequest();
                  }}
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      SEND
                    </>
                  )}
                </button>
                <button
                  className="btn-success"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "0 9999px 9999px 0",
                    borderLeft: "1px solid rgba(255, 255, 255, 0.24)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isMutating ? 0.7 : 1,
                    cursor: isMutating ? "not-allowed" : "pointer",
                  }}
                  disabled={isMutating}
                  onClick={() => setShowSendMenu((current) => !current)}
                  title="More send actions"
                >
                  <ChevronDown size={15} />
                </button>
                {showSendMenu && (
                  <div
                    ref={sendMenuRef}
                    className="animate-fade-in"
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 8px)",
                      width: 260,
                      zIndex: 1000,
                      padding: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      background: "rgba(24, 24, 24, 0.98)",
                      border: "1px solid var(--border-highlight)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    <button
                      className="btn"
                      style={{
                        justifyContent: "flex-start",
                        border: "none",
                        background: "transparent",
                        padding: "10px 12px",
                        fontSize: 13,
                      }}
                      onClick={handleSendAndDownload}
                    >
                      <Download size={15} />
                      Send and Download
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showSaveDialog && (
              <SaveDialog
                onClose={() => {
                  setShowSaveDialog(false);
                  if (isCloseSaveFlow) {
                    setShowCloseDialog(true);
                  }
                }}
                onSaved={() => {
                  if (pendingCloseTabId) {
                    closeTab(pendingCloseTabId);
                    setPendingCloseTabId(null);
                  }
                  setShowCloseDialog(false);
                  setIsCloseSaveFlow(false);
                }}
                anchorRef={saveBtnRef}
              />
            )}
            {showCodeModal && (
              <RequestCodeModal onClose={() => setShowCodeModal(false)} />
            )}
            <UnsavedChangesModal
              isOpen={showCloseDialog}
              requestName={
                tabs.find((tab) => tab.id === pendingCloseTabId)?.name ||
                "This request"
              }
              onSave={savePendingTab}
              onDiscard={discardPendingTab}
              onCancel={() => {
                setShowCloseDialog(false);
                setPendingCloseTabId(null);
              }}
            />
          </div>

          {/* Main Content — Request + Response */}
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: 0,
              padding: "12px 16px 16px",
              minHeight: 0,
            }}
          >
            <PanelGroup key={splitDirection} direction={splitDirection}>
              {/* Request panel with tabs */}
              <Panel
                defaultSize={splitDirection === "vertical" ? 40 : 50}
                minSize={20}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflow: "hidden",
                  paddingRight: splitDirection === "horizontal" ? 8 : 0,
                  paddingBottom: splitDirection === "vertical" ? 8 : 0,
                }}
              >
                <div
                  className="glass-panel"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <RequestTabs />
                </div>
              </Panel>

              <PanelResizeHandle
                className={`custom-resize-handle ${splitDirection === "vertical" ? "vertical" : ""}`}
              />

              {/* Response panel */}
              <Panel
                defaultSize={splitDirection === "vertical" ? 60 : 50}
                minSize={20}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflow: "hidden",
                  paddingLeft: splitDirection === "horizontal" ? 8 : 0,
                  paddingTop: splitDirection === "vertical" ? 8 : 0,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  <ResponseViewer />
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </>
      ) : (
        <CollectionFolderTabs />
      )}
    </div>
  );
}
