interface MergeRequestMethodBadgeProps {
  method?: string;
}

export function MergeRequestMethodBadge({
  method,
}: MergeRequestMethodBadgeProps) {
  const methodColor =
    method === "GET"
      ? "var(--method-get)"
      : method === "POST"
        ? "var(--method-post)"
        : method === "PUT"
          ? "var(--method-put)"
          : method === "DELETE"
            ? "var(--method-delete)"
            : "var(--text-tertiary)";
  const methodBackground =
    method === "GET"
      ? "var(--method-get-bg)"
      : method === "POST"
        ? "var(--method-post-bg)"
        : method === "PUT"
          ? "var(--method-put-bg)"
          : method === "DELETE"
            ? "var(--method-delete-bg)"
            : "var(--bg-tertiary)";

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        padding: "2px 6px",
        borderRadius: 4,
        color: methodColor,
        background: methodBackground,
      }}
    >
      {method || "REQ"}
    </span>
  );
}
