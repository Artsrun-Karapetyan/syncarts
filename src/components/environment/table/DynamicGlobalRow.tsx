import { CheckSquare } from "lucide-react";

export function DynamicGlobalRow({
  item,
}: {
  item: { key: string; desc: string };
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 1fr 40px",
        gap: 0,
        alignItems: "center",
        opacity: 0.6,
      }}
    >
      <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
        <CheckSquare size={16} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <input
        className="input"
        style={{
          width: "100%",
          fontSize: 13,
          background: "var(--bg-secondary)",
          cursor: "not-allowed",
          color: "var(--accent-primary)",
          borderRadius: 0,
          margin: "-1px 0 0 -1px",
        }}
        value={item.key}
        disabled
      />
      <input
        className="input"
        style={{
          width: "100%",
          fontSize: 13,
          background: "var(--bg-secondary)",
          cursor: "not-allowed",
          color: "var(--text-tertiary)",
          borderRadius: 0,
          margin: "-1px 0 0 -1px",
        }}
        value={item.desc}
        disabled
      />
      <div style={{ width: 40 }} />
    </div>
  );
}
