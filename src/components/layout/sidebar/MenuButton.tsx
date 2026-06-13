import type { LucideIcon } from 'lucide-react';

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  iconColor?: string;
  destructive?: boolean;
  onClick: () => void;
}

export function MenuButton({ icon: Icon, label, iconColor, destructive = false, onClick }: MenuButtonProps) {
  const color = destructive ? 'var(--status-delete)' : 'var(--text-primary)';
  const resolvedIconColor = destructive ? 'var(--status-delete)' : iconColor || 'var(--text-secondary)';

  return (
    <button
      type="button"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, color, background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background var(--transition-fast)', textAlign: 'left' }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = destructive ? 'var(--status-delete-bg)' : 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: resolvedIconColor, flexShrink: 0 }}>
        <Icon size={13} />
      </span>
      <span style={{ fontWeight: 500 }}>{label}</span>
    </button>
  );
}
