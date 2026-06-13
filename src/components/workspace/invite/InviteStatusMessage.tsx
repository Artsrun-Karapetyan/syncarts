interface InviteStatusMessageProps {
  statusMsg: string;
}

export function InviteStatusMessage({ statusMsg }: InviteStatusMessageProps) {
  if (!statusMsg) return null;

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        background: "var(--bg-secondary)",
        fontSize: 13,
        color: "var(--text-secondary)",
        textAlign: "center",
      }}
    >
      {statusMsg}
    </div>
  );
}
