export function itemRowStyle(isHighlighted: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: isHighlighted ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: isHighlighted ? 'var(--bg-tertiary)' : 'transparent',
    boxShadow: isHighlighted ? 'inset 0 0 0 1px var(--accent-primary)' : 'none',
    padding: '3px 8px',
    paddingLeft: 8,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  };
}

export function toggleStyle(cursor: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    height: 14,
    cursor,
    color: 'var(--text-tertiary)',
  };
}
