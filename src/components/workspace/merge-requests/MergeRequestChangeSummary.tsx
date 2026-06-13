interface MergeRequestChangeSummaryProps {
  added: number;
  deleted: number;
  modified: number;
}

export function MergeRequestChangeSummary({
  added,
  deleted,
  modified,
}: MergeRequestChangeSummaryProps) {
  return (
    <div
      style={{ display: "flex", gap: 24, marginBottom: 16, padding: "0 8px" }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "#00ffaa" }}>
        {added} Added
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#ffaa00" }}>
        {modified} Modified
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#ff5050" }}>
        {deleted} Deleted
      </span>
    </div>
  );
}
