export function InviteDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>OR</span>
      <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
    </div>
  );
}
