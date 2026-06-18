import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface MenuSubmenuProps {
  children: ReactNode;
  icon: LucideIcon;
  iconColor?: string;
  label: string;
}

export function MenuSubmenu({
  children,
  icon: Icon,
  iconColor,
  label,
}: MenuSubmenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        style={{
          alignItems: "center",
          background: open ? "var(--bg-tertiary)" : "transparent",
          border: "none",
          borderRadius: 8,
          color: "var(--text-primary)",
          cursor: "pointer",
          display: "flex",
          fontSize: 13,
          gap: 10,
          padding: "10px 12px",
          textAlign: "left",
          transition: "background var(--transition-fast)",
          width: "100%",
        }}
      >
        <span
          style={{
            alignItems: "center",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 7,
            color: iconColor || "var(--text-secondary)",
            display: "flex",
            flexShrink: 0,
            height: 28,
            justifyContent: "center",
            width: 28,
          }}
        >
          <Icon size={13} />
        </span>
        <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
        <ChevronRight size={14} />
      </button>
      {open && (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-highlight)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            display: "flex",
            flexDirection: "column",
            left: "calc(100% - 2px)",
            minWidth: 210,
            padding: 4,
            position: "absolute",
            top: 0,
            zIndex: 100000,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
