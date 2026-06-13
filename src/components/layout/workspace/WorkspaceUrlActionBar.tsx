import { Code2, Download } from "lucide-react";
import type { RefObject } from "react";

import { MethodSelector } from "../../request/method/MethodSelector";
import { UrlBar } from "../../request/url/UrlBar";
import { WorkspaceSendButton } from "./WorkspaceSendButton";

interface WorkspaceUrlActionBarProps {
  handleSendAndDownload: () => void;
  isMutating: boolean;
  sendMenuRef: RefObject<HTMLDivElement | null>;
  sendRequest: () => void;
  setShowCodeModal: (value: boolean) => void;
  setShowSendMenu: (value: boolean | ((current: boolean) => boolean)) => void;
  showSendMenu: boolean;
}

export function WorkspaceUrlActionBar({
  handleSendAndDownload,
  isMutating,
  sendMenuRef,
  sendRequest,
  setShowCodeModal,
  setShowSendMenu,
  showSendMenu,
}: WorkspaceUrlActionBarProps) {
  return (
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
        <WorkspaceSendButton
          isMutating={isMutating}
          sendRequest={sendRequest}
          setShowSendMenu={setShowSendMenu}
        />
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
  );
}
