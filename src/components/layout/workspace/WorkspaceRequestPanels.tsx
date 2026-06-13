import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { RequestTabs } from "../../request/tabs/RequestTabs";
import { ResponseViewer } from "../../response/ResponseViewer";

interface WorkspaceRequestPanelsProps {
  splitDirection: "horizontal" | "vertical";
}

export function WorkspaceRequestPanels({
  splitDirection,
}: WorkspaceRequestPanelsProps) {
  return (
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
          className={`custom-resize-handle ${
            splitDirection === "vertical" ? "vertical" : ""
          }`}
        />
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
  );
}
