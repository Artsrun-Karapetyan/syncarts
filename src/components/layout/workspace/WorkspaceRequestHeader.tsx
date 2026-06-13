import type { RefObject } from "react";

import type { TabData } from "../../../contexts/WorkspaceContext";
import { RequestCodeModal } from "../../request/code/RequestCodeModal";
import { SaveDialog } from "../../request/SaveDialog";
import { UnsavedChangesModal } from "../../ui/UnsavedChangesModal";
import { WorkspaceHeaderActions } from "./WorkspaceHeaderActions";
import { WorkspaceRequestNameInput } from "./WorkspaceRequestNameInput";
import { WorkspaceUrlActionBar } from "./WorkspaceUrlActionBar";

interface WorkspaceRequestHeaderProps {
  activeTab: TabData;
  handleDirectSave: () => void;
  handleSendAndDownload: () => void;
  isCloseSaveFlow: boolean;
  isMutating: boolean;
  pendingCloseTabId: string | null;
  saveBtnRef: RefObject<HTMLButtonElement | null>;
  savePendingTab: () => void;
  sendMenuRef: RefObject<HTMLDivElement | null>;
  setIsCloseSaveFlow: (value: boolean) => void;
  setPendingCloseTabId: (value: string | null) => void;
  setShowCloseDialog: (value: boolean) => void;
  setShowCodeModal: (value: boolean) => void;
  setShowSaveDialog: (value: boolean | ((current: boolean) => boolean)) => void;
  setShowSendMenu: (value: boolean | ((current: boolean) => boolean)) => void;
  showCloseDialog: boolean;
  showCodeModal: boolean;
  showSaveDialog: boolean;
  showSendMenu: boolean;
  splitDirection: "horizontal" | "vertical";
  tabs: TabData[];
  toggleSplitDirection: () => void;
  updateActiveTab: (data: Partial<TabData>) => void;
  closeTab: (id: string) => void;
  discardPendingTab: () => void;
  sendRequest: () => void;
}

export function WorkspaceRequestHeader(props: WorkspaceRequestHeaderProps) {
  const {
    activeTab,
    closeTab,
    discardPendingTab,
    handleDirectSave,
    handleSendAndDownload,
    isCloseSaveFlow,
    isMutating,
    pendingCloseTabId,
    saveBtnRef,
    savePendingTab,
    sendMenuRef,
    sendRequest,
    setIsCloseSaveFlow,
    setPendingCloseTabId,
    setShowCloseDialog,
    setShowCodeModal,
    setShowSaveDialog,
    setShowSendMenu,
    showCloseDialog,
    showCodeModal,
    showSaveDialog,
    showSendMenu,
    splitDirection,
    tabs,
    toggleSplitDirection,
    updateActiveTab,
  } = props;

  return (
    <div
      style={{
        padding: "12px 16px 0 16px",
        flexShrink: 0,
        position: "relative",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        <WorkspaceRequestNameInput
          activeTab={activeTab}
          updateActiveTab={updateActiveTab}
        />
        <WorkspaceHeaderActions
          activeTab={activeTab}
          handleDirectSave={handleDirectSave}
          saveBtnRef={saveBtnRef}
          setShowSaveDialog={setShowSaveDialog}
          splitDirection={splitDirection}
          toggleSplitDirection={toggleSplitDirection}
        />
      </div>
      <WorkspaceUrlActionBar
        handleSendAndDownload={handleSendAndDownload}
        isMutating={isMutating}
        sendMenuRef={sendMenuRef}
        sendRequest={sendRequest}
        setShowCodeModal={setShowCodeModal}
        setShowSendMenu={setShowSendMenu}
        showSendMenu={showSendMenu}
      />
      {showSaveDialog && (
        <SaveDialog
          onClose={() => {
            setShowSaveDialog(false);
            if (isCloseSaveFlow) setShowCloseDialog(true);
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
  );
}
