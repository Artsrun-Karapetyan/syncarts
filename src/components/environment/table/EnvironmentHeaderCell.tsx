export function EnvironmentHeaderCell({
  border = false,
  children,
}: {
  border?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: border ? "1px solid var(--border-color)" : undefined,
      }}
    >
      {children}
    </div>
  );
}
