interface MergeRequestsSidebarEmptyTextProps {
  text: string;
}

export function MergeRequestsSidebarEmptyText({
  text,
}: MergeRequestsSidebarEmptyTextProps) {
  return (
    <div
      style={{
        padding: 20,
        color: "var(--text-tertiary)",
        textAlign: "center",
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}
