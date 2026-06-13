interface MergeRequestErrorProps {
  text: string;
}

export function MergeRequestError({ text }: MergeRequestErrorProps) {
  return (
    <div
      style={{
        background: "rgba(255, 80, 80, 0.1)",
        color: "#ff5050",
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 14,
        border: "1px solid #ff5050",
      }}
    >
      {text}
    </div>
  );
}
