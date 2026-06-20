export function MergeRequestBadge({ count }: { count: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -2,
        right: -2,
        background: "#ff0055",
        color: "#fff",
        fontSize: 10,
        fontWeight: 900,
        width: 16,
        height: 16,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid var(--bg-primary)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    >
      {count > 9 ? "9+" : count}
    </div>
  );
}
