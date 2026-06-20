import { Search } from "lucide-react";

export function CollectionSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12, position: "relative" }}>
      <Search
        size={14}
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-tertiary)",
          pointerEvents: "none",
        }}
      />
      <input
        className="input"
        style={{ fontSize: 13, width: "100%", padding: "6px 10px 6px 30px" }}
        placeholder="Search collections & items..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
