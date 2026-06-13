interface HoverIconProps {
  children: React.ReactNode;
  color?: string;
  title?: string;
  onClick: (e: React.MouseEvent) => void;
}

export function HoverIcon({ children, color = 'var(--text-tertiary)', title, onClick }: HoverIconProps) {
  return (
    <div
      style={{ opacity: 0, width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color, transition: 'all var(--transition-fast)', flexShrink: 0, marginRight: color === 'var(--status-delete)' ? 4 : 0 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.background = color === 'var(--status-delete)' ? 'var(--status-delete-bg)' : 'var(--bg-secondary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0';
        e.currentTarget.style.background = 'transparent';
      }}
      title={title}
    >
      {children}
    </div>
  );
}
