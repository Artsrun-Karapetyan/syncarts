import { useState, useRef, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Link } from '@tanstack/react-router';
import { Settings2, Eye, LayoutGrid, UserPlus, LogIn, Trash2 } from 'lucide-react';

import { useStoredUser } from '../../lib/session';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Select } from '../ui/Select';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { InviteModal } from '../workspace/InviteModal';
import { JoinWorkspaceModal } from '../workspace/JoinWorkspaceModal';

export function TopBar() {
  const { workspaces, activeWorkspaceId, switchWorkspace, createWorkspace, removeWorkspace, environments, activeEnvironmentId, setActiveEnvironmentId, activeEnvironment } = useWorkspace();
  const user = useStoredUser();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isEnvManagerOpen, setIsEnvManagerOpen] = useState(false);
  const [isEnvQuickLookOpen, setIsEnvQuickLookOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const envQuickLookRef = useRef<HTMLDivElement>(null);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const isSharedWorkspace = !!activeWorkspace?.ownerId && !!user?.id && activeWorkspace.ownerId !== user.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (envQuickLookRef.current && !envQuickLookRef.current.contains(event.target as Node)) {
        setIsEnvQuickLookOpen(false);
      }
    };

    if (isEnvQuickLookOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEnvQuickLookOpen]);

  const isMac = navigator.userAgent.includes('Mac');
  const handleWindowDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isInteractive = target.closest('button, input, textarea, select, a, [role="button"]');
    if (event.button !== 0 || isInteractive) return;

    getCurrentWindow().startDragging().catch((err) => {
      console.error('Failed to start window drag', err);
    });
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleWindowDrag}
      style={{
        height: 60,
        width: '100%',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 24px',
        paddingLeft: isMac ? 80 : 24,
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Workspace Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Workspace
        </div>
        <div style={{ width: 288, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Select
              variant="pill"
              value={activeWorkspaceId}
              onChange={(val) => {
                if (val === 'new') {
                  setIsCreatingWorkspace(true);
                  setNewWorkspaceName('');
                } else {
                  switchWorkspace(val);
                }
              }}
              options={[
                ...workspaces.map((w) => ({
                  label: w.name,
                  value: w.id,
                  badge: w.ownerId && user?.id && w.ownerId !== user.id ? 'Shared' : undefined,
                })),
                { label: '+ Create Workspace', value: 'new' },
              ]}
            />
            {isCreatingWorkspace && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 320,
                  padding: 16,
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Create New Workspace</div>
                <input
                  autoFocus
                  className="input"
                  style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}
                  placeholder="Workspace Name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (newWorkspaceName.trim()) createWorkspace(newWorkspaceName.trim());
                      setIsCreatingWorkspace(false);
                      setNewWorkspaceName('');
                    }
                    if (e.key === 'Escape') {
                      setIsCreatingWorkspace(false);
                      setNewWorkspaceName('');
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => {
                      setIsCreatingWorkspace(false);
                      setNewWorkspaceName('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)' }}
                    onClick={() => {
                      if (newWorkspaceName.trim()) createWorkspace(newWorkspaceName.trim());
                      setIsCreatingWorkspace(false);
                      setNewWorkspaceName('');
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
          {activeWorkspace && workspaces.length > 1 && (
            <button
              className="tooltip-trigger"
              data-tooltip={isSharedWorkspace ? 'Leave Workspace' : 'Delete Workspace'}
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                color: 'var(--text-tertiary)',
                background: 'var(--bg-primary)',
              }}
              onClick={() => setIsDeleteWorkspaceOpen(true)}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div
        data-tauri-drag-region
        onMouseDown={handleWindowDrag}
        style={{
          flex: 1,
          alignSelf: 'stretch',
          minWidth: 64,
          cursor: 'grab',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn"
            style={{ height: 28, padding: '0 12px', fontSize: 13 }}
            onClick={() => setIsJoinOpen(true)}
          >
            <LogIn size={14} style={{ marginRight: 6 }} />
            Join
          </button>
          <button
            className="btn"
            style={{ height: 28, padding: '0 12px', fontSize: 13 }}
            onClick={() => setIsInviteOpen(true)}
          >
            <UserPlus size={14} style={{ marginRight: 6 }} />
            Invite
          </button>
        </div>

        {/* Environment Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }} ref={envQuickLookRef}>
            <button
              className="tooltip-trigger"
              data-tooltip="Environment Quick Look"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4, display: 'flex' }}
              onClick={() => setIsEnvQuickLookOpen(!isEnvQuickLookOpen)}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              <Eye size={18} />
            </button>
            {isEnvQuickLookOpen && (
              <div
                className="glass-panel animate-fade-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 300,
                  padding: 16,
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{activeEnvironment ? activeEnvironment.name : 'No Environment'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {activeEnvironment?.variables.filter(v => v.enabled && v.key).map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--accent-primary)' }}>{v.key}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{v.value || '-'}</span>
                    </div>
                  ))}
                  {(!activeEnvironment || activeEnvironment.variables.filter(v => v.enabled && v.key).length === 0) && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No active variables</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ width: 180 }}>
            <Select
              variant="pill"
              value={activeEnvironmentId || 'none'}
              onChange={(val) => {
                if (val === 'none') setActiveEnvironmentId(null);
                else setActiveEnvironmentId(val);
              }}
              options={[
                { label: 'No Environment', value: 'none' },
                ...environments.map(e => ({ label: e.name, value: e.id }))
              ]}
            />
          </div>

          <button
            className="tooltip-trigger"
            data-tooltip="Manage Environments"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4, display: 'flex' }}
            onClick={() => setIsEnvManagerOpen(true)}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        {/* Profile */}
        <Link
        to="/profile"
        style={{
          borderRadius: 9999,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          padding: '6px 16px 6px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          transition: 'border-color var(--transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-highlight)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.35), rgba(99, 102, 241, 0.1))',
            border: '2px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            flexShrink: 0,
          }}
        >
          {(user?.name?.trim()?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase()}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {user?.name?.trim() || 'Your profile'}
        </div>
        <Settings2 size={13} style={{ color: 'var(--text-tertiary)', marginLeft: 4 }} />
      </Link>
      </div>
      
      <EnvironmentManager 
        isOpen={isEnvManagerOpen} 
        onClose={() => setIsEnvManagerOpen(false)} 
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={activeWorkspaceId}
      />

      <JoinWorkspaceModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteWorkspaceOpen}
        title={isSharedWorkspace ? 'Leave Workspace' : 'Delete Workspace'}
        message={
          isSharedWorkspace
            ? `Leave "${activeWorkspace?.name}"? You will lose access until someone invites you again.`
            : `Delete "${activeWorkspace?.name}"? This removes the workspace and its collections for every member.`
        }
        confirmText={isSharedWorkspace ? 'Leave' : 'Delete'}
        cancelText="Cancel"
        isDestructive
        onCancel={() => setIsDeleteWorkspaceOpen(false)}
        onConfirm={() => {
          if (!activeWorkspace) return;
          void removeWorkspace(activeWorkspace.id).finally(() => setIsDeleteWorkspaceOpen(false));
        }}
      />
    </div>
  );
}
