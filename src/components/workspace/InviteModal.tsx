import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { isMemberWorkspace } from "../../contexts/workspace/sync/sharing";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { api } from "../../lib/api";
import { useStoredUser } from "../../lib/session";
import { InviteDivider } from "./invite/InviteDivider";
import { InviteEmailForm } from "./invite/InviteEmailForm";
import { InviteLinkSection } from "./invite/InviteLinkSection";
import { InviteMembersList } from "./invite/InviteMembersList";
import { InviteStatusMessage } from "./invite/InviteStatusMessage";
import { InviteWorkspaceSelector } from "./invite/InviteWorkspaceSelector";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function InviteModal({ isOpen, onClose, workspaceId }: Props) {
  const {
    workspaces,
    activeWorkspaceId,
    reloadWorkspaces,
    createWorkspace,
    switchWorkspace,
    localDefaultWorkspaceId,
  } = useWorkspace();
  const user = useStoredUser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>(
    [],
  );
  const visibleWorkspaces = workspaces.filter(
    (workspace) => !isMemberWorkspace(workspace, user?.id),
  );
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === workspaceId) ||
    workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const selectedWorkspaces = visibleWorkspaces.filter((workspace) =>
    selectedWorkspaceIds.includes(workspace.id),
  );
  const memberWorkspaces =
    selectedWorkspaces.length > 0
      ? selectedWorkspaces
      : activeWorkspace
        ? [activeWorkspace]
        : [];

  useEffect(() => {
    if (!isOpen) return;
    const availableWorkspaces = workspaces.filter(
      (workspace) => !isMemberWorkspace(workspace, user?.id),
    );
    const preferredWorkspaceId = availableWorkspaces.some(
      (workspace) => workspace.id === workspaceId,
    )
      ? workspaceId
      : activeWorkspaceId;

    setSelectedWorkspaceIds(
      preferredWorkspaceId &&
        availableWorkspaces.some(
          (workspace) => workspace.id === preferredWorkspaceId,
        )
        ? [preferredWorkspaceId]
        : [],
    );
    // Don't reset generatedLink or statusMsg on every workspace sync/switch,
    // only when the modal is reopened.
  }, [isOpen, workspaceId, user?.id]);

  useEffect(() => {
    if (isOpen) {
      setGeneratedLink("");
      setStatusMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    if (selectedWorkspaceIds.length === 0) {
      setStatusMsg("Select at least one workspace");
      return;
    }

    try {
      setLoading(true);
      const finalWorkspaceIds = [...selectedWorkspaceIds];
      const finalWorkspaces = [...selectedWorkspaces];

      const defaultWsIndex = finalWorkspaces.findIndex(
        (w) => w.id === localDefaultWorkspaceId,
      );
      if (defaultWsIndex !== -1) {
        const defaultWs = finalWorkspaces[defaultWsIndex];
        const newWsId = createWorkspace(
          "Shared Workspace",
          defaultWs.collections,
          defaultWs.environments,
        );
        finalWorkspaceIds[finalWorkspaceIds.indexOf(localDefaultWorkspaceId)] =
          newWsId;
        finalWorkspaces[defaultWsIndex] = {
          ...defaultWs,
          id: newWsId,
          name: "Shared Workspace",
        };
        switchWorkspace(newWsId);
      }

      const res = await api.post("/invites/generate", {
        workspaceIds: finalWorkspaceIds,
        workspaces: finalWorkspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          collections: workspace.collections,
          environments: workspace.environments || [],
        })),
      });
      await reloadWorkspaces();
      setGeneratedLink(`syncarts://invite/${res.data.token}`);
      setStatusMsg("");
    } catch (err: any) {
      setStatusMsg(err.message || "Error generating link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selectedWorkspaceIds.length === 0) return;

    try {
      setLoading(true);
      const finalWorkspaceIds = [...selectedWorkspaceIds];
      const finalWorkspaces = [...selectedWorkspaces];

      const defaultWsIndex = finalWorkspaces.findIndex(
        (w) => w.id === localDefaultWorkspaceId,
      );
      if (defaultWsIndex !== -1) {
        const defaultWs = finalWorkspaces[defaultWsIndex];
        const newWsId = createWorkspace(
          "Shared Workspace",
          defaultWs.collections,
          defaultWs.environments,
        );
        finalWorkspaceIds[finalWorkspaceIds.indexOf(localDefaultWorkspaceId)] =
          newWsId;
        finalWorkspaces[defaultWsIndex] = {
          ...defaultWs,
          id: newWsId,
          name: "Shared Workspace",
        };
        switchWorkspace(newWsId);
      }

      await api.post("/invites/add-member", {
        workspaceIds: finalWorkspaceIds,
        workspaces: finalWorkspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          collections: workspace.collections,
          environments: workspace.environments || [],
        })),
        email,
      });
      await reloadWorkspaces();
      setStatusMsg("Member added successfully");
      setEmail("");
    } catch (err: any) {
      setStatusMsg(err.message || "Error adding member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (
    targetWorkspaceId: string,
    memberUserId: string,
  ) => {
    const targetWorkspace = workspaces.find(
      (workspace) => workspace.id === targetWorkspaceId,
    );
    if (!targetWorkspace || memberUserId === targetWorkspace.ownerId) return;

    try {
      setLoading(true);
      await api.delete(
        `/workspaces/${targetWorkspace.id}/members/${memberUserId}`,
      );
      await reloadWorkspaces();
      setStatusMsg("Member removed");
    } catch (err: any) {
      setStatusMsg(err.message || "Error removing member");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (
    targetWorkspaceId: string,
    memberUserId: string,
    newRole: string,
  ) => {
    try {
      setLoading(true);
      await api.put(
        `/workspaces/${targetWorkspaceId}/members/${memberUserId}/role`,
        { role: newRole },
      );
      await reloadWorkspaces();
      setStatusMsg("Role updated");
    } catch (err: any) {
      setStatusMsg(err.message || "Error updating role");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: 480,
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Invite to Workspace
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <InviteWorkspaceSelector
            activeWorkspaceId={activeWorkspaceId}
            selectedWorkspaceIds={selectedWorkspaceIds}
            setSelectedWorkspaceIds={setSelectedWorkspaceIds}
            visibleWorkspaces={visibleWorkspaces}
          />
          <InviteEmailForm
            email={email}
            loading={loading}
            selectedWorkspaceIds={selectedWorkspaceIds}
            setEmail={setEmail}
            onSubmit={handleInviteEmail}
          />
          <InviteMembersList
            activeWorkspaceId={activeWorkspaceId}
            loading={loading}
            memberWorkspaces={memberWorkspaces}
            userId={user?.id}
            onChangeRole={handleChangeRole}
            onRemoveMember={handleRemoveMember}
          />
          <InviteDivider />
          <InviteLinkSection
            copied={copied}
            generatedLink={generatedLink}
            loading={loading}
            selectedWorkspaceIds={selectedWorkspaceIds}
            onCopy={handleCopy}
            onGenerateLink={handleGenerateLink}
          />
          <InviteStatusMessage statusMsg={statusMsg} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
