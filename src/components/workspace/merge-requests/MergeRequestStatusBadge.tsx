interface MergeRequestStatusBadgeProps {
  status: string;
}

export function MergeRequestStatusBadge({
  status,
}: MergeRequestStatusBadgeProps) {
  return (
    <div
      style={{
        padding: "6px 14px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        background:
          status === "MERGED"
            ? "rgba(0, 255, 170, 0.1)"
            : status === "REJECTED"
              ? "rgba(255, 80, 80, 0.1)"
              : "rgba(0, 240, 255, 0.1)",
        color:
          status === "MERGED"
            ? "#00ffaa"
            : status === "REJECTED"
              ? "#ff5050"
              : "#00f0ff",
      }}
    >
      {status}
    </div>
  );
}
