import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Settings2 } from 'lucide-react';

import { useStoredUser } from '../../lib/session';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Select } from '../ui/Select';

export function TopBar() {
  const { workspaces, activeWorkspaceId, switchWorkspace, createWorkspace } = useWorkspace();
  const user = useStoredUser();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  return (
    <div
      style={{
        height: 60,
        width: '100%',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      {/* Workspace Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Workspace
        </div>
        <div style={{ width: 260 }}>
          {isCreatingWorkspace ? (
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
              onBlur={() => {
                setTimeout(() => {
                  if (newWorkspaceName.trim()) createWorkspace(newWorkspaceName.trim());
                  setIsCreatingWorkspace(false);
                  setNewWorkspaceName('');
                }, 100);
              }}
            />
          ) : (
            <Select
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
                ...workspaces.map((w) => ({ label: w.name, value: w.id })),
                { label: '+ Create Workspace', value: 'new' },
              ]}
            />
          )}
        </div>
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
  );
}
