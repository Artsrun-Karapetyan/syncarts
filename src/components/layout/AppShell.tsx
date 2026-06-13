import { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { WorkspaceProvider } from "../../contexts/WorkspaceContext";
import { useStoredUser } from "../../lib/session";
import { GlobalContextMenu } from "./GlobalContextMenu";
import { GlobalDropZone } from "./GlobalDropZone";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const user = useStoredUser();

  if (!user) return null;

  return (
    <WorkspaceProvider key={user.id} userId={user.id}>
      <GlobalDropZone>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            width: "100vw",
            background: "var(--bg-primary)",
            overflow: "hidden",
          }}
        >
          <TopBar />
          <PanelGroup
            direction="horizontal"
            style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
          >
            <Panel
              defaultSize={20}
              minSize={15}
              maxSize={40}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Sidebar />
            </Panel>
            <PanelResizeHandle className="custom-resize-handle" />
            <Panel
              defaultSize={80}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {children}
              </div>
            </Panel>
          </PanelGroup>
        </div>
        <GlobalContextMenu />
      </GlobalDropZone>
    </WorkspaceProvider>
  );
}
