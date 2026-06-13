export function EnvironmentIconButton({
  tooltip,
  onClick,
  children,
}: {
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="tooltip-trigger"
      data-tooltip={tooltip}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--text-tertiary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClick}
      onMouseEnter={(e) =>
        (e.currentTarget.style.color = "var(--text-primary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "var(--text-tertiary)")
      }
    >
      {children}
    </button>
  );
}
