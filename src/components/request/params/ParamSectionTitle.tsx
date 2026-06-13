export function ParamSectionTitle({ title }: { title: string }) {
  return (
    <div
      style={{
        marginBottom: 8,
        color: "var(--text-secondary)",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {title}
    </div>
  );
}
