export function ImportDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          flex: 1,
          height: 1,
          background: "var(--border-color)",
        }}
      />
      <div
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        OR
      </div>
      <div
        style={{
          flex: 1,
          height: 1,
          background: "var(--border-color)",
        }}
      />
    </div>
  );
}
