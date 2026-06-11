import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Mail, Link as LinkIcon, Loader2, UserMinus, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useStoredUser } from '../../lib/session';
import { Select } from '../ui/Select';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function InviteModal({ isOpen, onClose, workspaceId }: Props) {
  const { workspaces, activeWorkspaceId, reloadWorkspaces, createWorkspace, switchWorkspace, localDefaultWorkspaceId } = useWorkspace();
  const user = useStoredUser();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const isSharedWorkspace = (workspace: { ownerId?: string }) => !!workspace.ownerId && !!user?.id && workspace.ownerId !== user.id;
  const visibleWorkspaces = workspaces.filter((workspace) => !isSharedWorkspace(workspace));
  const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceId)
    || workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const selectedWorkspaces = visibleWorkspaces.filter((workspace) => selectedWorkspaceIds.includes(workspace.id));
  const memberWorkspaces = selectedWorkspaces.length > 0
    ? selectedWorkspaces
    : activeWorkspace
      ? [activeWorkspace]
      : [];

  useEffect(() => {
    if (!isOpen) return;
    const availableWorkspaces = workspaces.filter((workspace) => !isSharedWorkspace(workspace));
    const preferredWorkspaceId = availableWorkspaces.some((workspace) => workspace.id === workspaceId)
      ? workspaceId
      : activeWorkspaceId;

    setSelectedWorkspaceIds(
      preferredWorkspaceId && availableWorkspaces.some((workspace) => workspace.id === preferredWorkspaceId)
        ? [preferredWorkspaceId]
        : []
    );
    setGeneratedLink('');
    setStatusMsg('');
  }, [activeWorkspaceId, isOpen, workspaceId, workspaces, user?.id]);

  if (!isOpen) return null;

  const getWorkspaceMeta = (workspace: { id: string; name: string; ownerId?: string }) => {
    if (workspace.id === activeWorkspaceId) return 'Current workspace';
    return 'Available workspace';
  };

  const handleGenerateLink = async () => {
    if (selectedWorkspaceIds.length === 0) {
      setStatusMsg('Select at least one workspace');
      return;
    }

    try {
      setLoading(true);
      const finalWorkspaceIds = [...selectedWorkspaceIds];
      const finalWorkspaces = [...selectedWorkspaces];

      const defaultWsIndex = finalWorkspaces.findIndex(w => w.id === localDefaultWorkspaceId);
      if (defaultWsIndex !== -1) {
        const defaultWs = finalWorkspaces[defaultWsIndex];
        const newWsId = createWorkspace('Shared Workspace', defaultWs.collections, defaultWs.environments);
        finalWorkspaceIds[finalWorkspaceIds.indexOf(localDefaultWorkspaceId)] = newWsId;
        finalWorkspaces[defaultWsIndex] = { ...defaultWs, id: newWsId, name: 'Shared Workspace' };
        switchWorkspace(newWsId);
      }

      const res = await api.post('/invites/generate', {
        workspaceIds: finalWorkspaceIds,
        workspaces: finalWorkspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          collections: workspace.collections,
          environments: workspace.environments || []
        })),
      });
      setGeneratedLink(`syncarts://invite/${res.data.token}`);
      setStatusMsg('');
    } catch (err: any) {
      setStatusMsg(err.message || 'Error generating link');
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

      const defaultWsIndex = finalWorkspaces.findIndex(w => w.id === localDefaultWorkspaceId);
      if (defaultWsIndex !== -1) {
        const defaultWs = finalWorkspaces[defaultWsIndex];
        const newWsId = createWorkspace('Shared Workspace', defaultWs.collections, defaultWs.environments);
        finalWorkspaceIds[finalWorkspaceIds.indexOf(localDefaultWorkspaceId)] = newWsId;
        finalWorkspaces[defaultWsIndex] = { ...defaultWs, id: newWsId, name: 'Shared Workspace' };
        switchWorkspace(newWsId);
      }

      await api.post('/invites/add-member', {
        workspaceIds: finalWorkspaceIds,
        workspaces: finalWorkspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          collections: workspace.collections,
          environments: workspace.environments || []
        })),
        email
      });
      await reloadWorkspaces();
      setStatusMsg('Member added successfully');
      setEmail('');
    } catch (err: any) {
      setStatusMsg(err.message || 'Error adding member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (targetWorkspaceId: string, memberUserId: string) => {
    const targetWorkspace = workspaces.find((workspace) => workspace.id === targetWorkspaceId);
    if (!targetWorkspace || memberUserId === targetWorkspace.ownerId) return;

    try {
      setLoading(true);
      await api.delete(`/workspaces/${targetWorkspace.id}/members/${memberUserId}`);
      await reloadWorkspaces();
      setStatusMsg('Member removed');
    } catch (err: any) {
      setStatusMsg(err.message || 'Error removing member');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (targetWorkspaceId: string, memberUserId: string, newRole: string) => {
    try {
      setLoading(true);
      await api.put(`/workspaces/${targetWorkspaceId}/members/${memberUserId}/role`, { role: newRole });
      await reloadWorkspaces();
      setStatusMsg('Role updated');
    } catch (err: any) {
      setStatusMsg(err.message || 'Error updating role');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: 480,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Invite to Workspace</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Choose Workspaces</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {visibleWorkspaces.map((workspace) => {
                const checked = selectedWorkspaceIds.includes(workspace.id);

                return (
                  <label
                    key={workspace.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      background: checked ? 'var(--bg-secondary)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedWorkspaceIds((current) =>
                          current.includes(workspace.id)
                            ? current.filter((id) => id !== workspace.id)
                            : [...current, workspace.id]
                        );
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</span>
                        {workspace.id !== localDefaultWorkspaceId && (
                          <span
                            style={{
                              flexShrink: 0,
                              border: '1px solid rgba(99, 102, 241, 0.34)',
                              borderRadius: 999,
                              padding: '2px 7px',
                              background: 'rgba(99, 102, 241, 0.12)',
                              color: 'var(--text-secondary)',
                              fontSize: 10,
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            Shared
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {getWorkspaceMeta(workspace)}
                      </span>
                    </div>
                  </label>
                );
              })}
              {visibleWorkspaces.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No workspaces available.</div>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Add Member by Email</h3>
            <form onSubmit={handleInviteEmail} style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-tertiary)' }} />
                <input
                  type="email"
                  className="input"
                  style={{ width: '100%', paddingLeft: 36 }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || !email || selectedWorkspaceIds.length === 0}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Add Member'}
              </button>
            </form>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              The selected user will be added to every checked workspace.
            </p>
          </div>

          {memberWorkspaces.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={15} />
                Workspace Members
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto' }}>
                {memberWorkspaces.map((memberWorkspace) => {
                  const members = memberWorkspace.members || [];
                  const canManageMembers = !!memberWorkspace.ownerId && memberWorkspace.ownerId === user?.id;

                  return (
                    <div key={memberWorkspace.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {memberWorkspace.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {members.length || 1} member{(members.length || 1) === 1 ? '' : 's'}
                          </div>
                        </div>
                        {memberWorkspace.id === activeWorkspaceId && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                            Current
                          </span>
                        )}
                      </div>

                      {members.length > 0 ? members.map((member) => {
                        const isOwner = member.userId === memberWorkspace.ownerId;
                        return (
                          <div
                            key={`${memberWorkspace.id}-${member.userId}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              padding: '9px 10px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 10,
                              background: 'var(--bg-secondary)',
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.user?.name || member.user?.email || member.userId}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.user?.email || member.role}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {canManageMembers && !isOwner ? (
                                <Select
                                  value={member.role}
                                  disabled={loading}
                                  onChange={(val) => handleChangeRole(memberWorkspace.id, member.userId, val)}
                                  options={[
                                    { value: 'MEMBER', label: 'Editor' },
                                    { value: 'VIEWER', label: 'Viewer' }
                                  ]}
                                  variant="ghost"
                                  style={{ 
                                    width: 100,
                                    color: member.role === 'VIEWER' ? 'var(--status-put)' : 'var(--status-get)',
                                    background: member.role === 'VIEWER' ? 'var(--status-put-bg)' : 'var(--status-get-bg)'
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                  {isOwner ? 'Owner' : member.role === 'VIEWER' ? 'Viewer' : 'Editor'}
                                </span>
                              )}
                              {canManageMembers && !isOwner && (
                                <button
                                  className="btn"
                                  disabled={loading}
                                  onClick={() => handleRemoveMember(memberWorkspace.id, member.userId)}
                                  style={{ height: 26, width: 30, padding: 0, justifyContent: 'center', color: 'var(--status-delete)' }}
                                >
                                  <UserMinus size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }) : (
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '9px 10px', border: '1px dashed var(--border-color)', borderRadius: 10 }}>
                          Only you are in this workspace.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>

          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Share an Invite Link</h3>
            {!generatedLink ? (
              <button className="btn" onClick={handleGenerateLink} disabled={loading || selectedWorkspaceIds.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
                <LinkIcon size={16} style={{ marginRight: 8 }} />
                Generate Link
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  className="input font-mono"
                  style={{ width: '100%', fontSize: 12 }}
                  value={generatedLink}
                  onClick={(e) => e.currentTarget.select()}
                />
                <button className="btn btn-primary" onClick={handleCopy} style={{ width: 100, justifyContent: 'center' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              Anyone with this link can join the selected workspaces. The link will open SyncArts directly.
            </p>
          </div>

          {statusMsg && (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
