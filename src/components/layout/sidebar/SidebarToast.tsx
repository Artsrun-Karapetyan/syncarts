import { GitFork } from "lucide-react";

export function SidebarToast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        maxWidth: 360,
        background: "rgba(17, 24, 39, 0.98)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-highlight)",
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "var(--shadow-lg)",
        zIndex: 100000,
        animation: "fade-in 0.3s ease-out",
      }}
    >
      <GitFork size={16} style={{ color: "var(--accent-primary)" }} />
      <span style={{ lineHeight: 1.4 }}>{message}</span>
    </div>
  );
}
