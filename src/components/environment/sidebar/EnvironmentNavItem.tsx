export function EnvironmentNavItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 6,
        cursor: "pointer",
        background: active ? "var(--bg-tertiary)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        marginBottom: 8,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
