import { GitFork } from 'lucide-react';

export function SidebarToast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        background: 'var(--status-success-bg)',
        color: 'var(--status-success)',
        border: '1px solid var(--status-success)',
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 99999,
        animation: 'fade-in 0.3s ease-out',
      }}
    >
      <GitFork size={16} />
      {message}
    </div>
  );
}
