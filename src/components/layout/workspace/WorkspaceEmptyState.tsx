interface WorkspaceEmptyStateProps {
  onAddTab: () => void;
}

export function WorkspaceEmptyState({ onAddTab }: WorkspaceEmptyStateProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          No request open
        </div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          Create a request or open one from a collection.
        </div>
        <button className="btn" style={{ marginTop: 4 }} onClick={onAddTab}>
          New Request
        </button>
      </div>
    </div>
  );
}
