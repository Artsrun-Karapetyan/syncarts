interface Props {
  label: string;
  value: string | number;
}

export function CollectionHealthMetricCard({ label, value }: Props) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          color: "var(--text-primary)",
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "var(--text-tertiary)",
          fontSize: 11,
          fontWeight: 600,
          marginTop: 4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
