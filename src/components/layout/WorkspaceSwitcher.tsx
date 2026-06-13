import { useEffect, useRef, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

import { useStoredUser } from '../../lib/session';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { isMemberWorkspace, isSharedWorkspace } from '../../contexts/workspace/sharing';
import { Select } from '../ui/Select';
import { ConfirmModal } from '../ui/ConfirmModal';

export function WorkspaceSwitcher() {
  const {
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    createWorkspace,
    removeWorkspace,
    renameWorkspace,
    localDefaultWorkspaceId,
  } = useWorkspace();
  const user = useStoredUser();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
  const [renameWorkspaceName, setRenameWorkspaceName] = useState('');
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const createPopoverRef = useRef<HTMLDivElement | null>(null);
  const renamePopoverRef = useRef<HTMLDivElement | null>(null);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const isActiveMemberWorkspace = isMemberWorkspace(activeWorkspace, user?.id);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (createPopoverRef.current?.contains(event.target as Node)) return;
      if (renamePopoverRef.current?.contains(event.target as Node)) return;
      setIsCreatingWorkspace(false);
      setIsRenamingWorkspace(false);
    };

    if (isCreatingWorkspace || isRenamingWorkspace) {
      document.addEventListener('pointerdown', handlePointerDown);
    }

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCreatingWorkspace, isRenamingWorkspace]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 14,
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Workspace
        </div>
        {activeWorkspace && activeWorkspace.id !== localDefaultWorkspaceId && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="tooltip-trigger"
              data-tooltip="Rename Workspace"
              style={iconButtonStyle}
              onClick={() => {
                setRenameWorkspaceName(activeWorkspace.name);
                setIsRenamingWorkspace(true);
                setIsCreatingWorkspace(false);
              }}
            >
              <Edit2 size={14} />
            </button>
            {workspaces.length > 1 && (
              <button
                type="button"
                className="tooltip-trigger"
                data-tooltip={isActiveMemberWorkspace ? 'Leave Workspace' : 'Delete Workspace'}
                style={iconButtonStyle}
                onClick={() => setIsDeleteWorkspaceOpen(true)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Select
          variant="pill"
          value={activeWorkspaceId}
          onChange={(val) => {
            if (val === 'new') {
              setIsCreatingWorkspace(true);
              setIsRenamingWorkspace(false);
              setNewWorkspaceName('');
            } else {
              switchWorkspace(val);
            }
          }}
          options={[
            ...workspaces.map((w) => ({
              label: w.name,
              value: w.id,
              badge: isSharedWorkspace(w) ? 'Shared' : undefined,
            })),
            { label: '+ Create Workspace', value: 'new' },
          ]}
        />
      </div>

      {isCreatingWorkspace && (
        <div ref={createPopoverRef} className="glass-panel animate-fade-in" style={popoverStyle}>
          <div style={popoverTitleStyle}>Create New Workspace</div>
          <input
            autoFocus
            className="input"
            style={popoverInputStyle}
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
            <button className="btn" style={popoverButtonStyle} onClick={() => { setIsCreatingWorkspace(false); setNewWorkspaceName(''); }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={popoverPrimaryButtonStyle}
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

      {isRenamingWorkspace && activeWorkspace && (
        <div ref={renamePopoverRef} className="glass-panel animate-fade-in" style={popoverStyle}>
          <div style={popoverTitleStyle}>Rename Workspace</div>
          <input
            autoFocus
            className="input"
            style={popoverInputStyle}
            placeholder="Workspace Name"
            value={renameWorkspaceName}
            onChange={(e) => setRenameWorkspaceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (renameWorkspaceName.trim()) renameWorkspace(activeWorkspace.id, renameWorkspaceName.trim());
                setIsRenamingWorkspace(false);
              }
              if (e.key === 'Escape') setIsRenamingWorkspace(false);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" style={popoverButtonStyle} onClick={() => setIsRenamingWorkspace(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={popoverPrimaryButtonStyle}
              onClick={() => {
                if (renameWorkspaceName.trim()) renameWorkspace(activeWorkspace.id, renameWorkspaceName.trim());
                setIsRenamingWorkspace(false);
              }}
            >
              Rename
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteWorkspaceOpen}
        title={isActiveMemberWorkspace ? 'Leave Workspace' : 'Delete Workspace'}
        message={
          isActiveMemberWorkspace
            ? `Leave "${activeWorkspace?.name}"? You will lose access until someone invites you again.`
            : `Delete "${activeWorkspace?.name}"? This removes the workspace and its collections for every member.`
        }
        confirmText={isActiveMemberWorkspace ? 'Leave' : 'Delete'}
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

const iconButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  color: 'var(--text-tertiary)',
  background: 'var(--bg-primary)',
};

const popoverStyle: React.CSSProperties = {
  padding: 14,
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  boxShadow: 'var(--shadow-lg)',
};

const popoverTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const popoverInputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 13,
  padding: '8px 10px',
};

const popoverButtonStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12,
};

const popoverPrimaryButtonStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
};
