import { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { GlobalContextMenu } from "@/components/layout/GlobalContextMenu";
import { GlobalDropZone } from "@/components/layout/GlobalDropZone";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/topbar/TopBar";
import { AppUpdateBanner } from "@/components/update/AppUpdateBanner";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { useStoredUser } from "@/lib/session";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const user = useStoredUser();

  const userId = user?.id || "offline";

  return (
    <WorkspaceProvider key={userId} userId={userId}>
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
              defaultSize={22}
              minSize={20}
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
        <AppUpdateBanner />
        <GlobalContextMenu />
      </GlobalDropZone>
    </WorkspaceProvider>
  );
}
