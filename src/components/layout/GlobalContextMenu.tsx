import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function GlobalContextMenu() {
  const [menuConfig, setMenuConfig] = useState<{
    x: number;
    y: number;
    textToCopy: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // If another component has already handled the context menu, do nothing.
      if (e.defaultPrevented) return;

      const target = e.target as HTMLElement;

      let textToCopy = "";
      const selection = window.getSelection()?.toString();

      if (selection && selection.trim().length > 0) {
        textToCopy = selection;
      } else if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        textToCopy = target.value;
      } else {
        const copyableContainer = target.closest(
          ".monaco-editor, pre, code, .response-raw-body, .path-var-span, .env-var-span",
        );
        if (copyableContainer) {
          textToCopy =
            (copyableContainer as HTMLElement).innerText ||
            copyableContainer.textContent ||
            "";
        }
      }

      textToCopy = textToCopy.trim();

      if (textToCopy) {
        e.preventDefault(); // Prevent native right click menu (already prevented globally, but good practice)
        setMenuConfig({
          x: e.clientX,
          y: e.clientY,
          textToCopy,
        });
      } else {
        setMenuConfig(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuConfig(null);
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  if (!menuConfig) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: menuConfig.y,
        left: menuConfig.x,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: 8,
        minWidth: 160,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
      }}
    >
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          fontSize: 13,
          color: "var(--text-primary)",
          background: "transparent",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          transition: "background var(--transition-fast)",
          textAlign: "left",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard
            .writeText(menuConfig.textToCopy)
            .catch(console.error);
          setMenuConfig(null);
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-tertiary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            flexShrink: 0,
          }}
        >
          <Copy size={12} />
        </span>
        <span style={{ fontWeight: 500 }}>Copy</span>
      </button>
    </div>
  );
}
