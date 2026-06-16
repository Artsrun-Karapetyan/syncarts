/* eslint-disable react/no-multi-comp */
import { Code, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ExtractVariableModal } from "./ExtractVariableModal";

interface CtxMenuState {
  x: number;
  y: number;
  path: any[];
  value: any;
}

const CtxMenuItem = ({ icon: Icon, label, onClick }: any) => (
  <div
    style={{
      padding: "6px 10px",
      fontSize: 13,
      color: "var(--text-secondary)",
      cursor: "pointer",
      borderRadius: "4px",
      transition: "background var(--transition-fast)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "var(--bg-secondary)";
      e.currentTarget.style.color = "var(--text-primary)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "var(--text-secondary)";
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {Icon && <Icon size={14} />}
      <span>{label}</span>
    </div>
  </div>
);

export function JsonContextMenu() {
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [extractModal, setExtractModal] = useState<{ path: any[] } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: any) => {
      setCtxMenu(e.detail);
    };
    window.addEventListener("json-extract-context-menu", handleContextMenu);
    return () => {
      window.removeEventListener(
        "json-extract-context-menu",
        handleContextMenu,
      );
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    };
    if (ctxMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ctxMenu]);

  return (
    <>
      {ctxMenu &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: ctxMenu.y,
              left: ctxMenu.x,
              zIndex: 9999,
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              padding: "4px",
              minWidth: 160,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CtxMenuItem
              icon={Copy}
              label="Copy Value"
              onClick={() => {
                if (typeof ctxMenu.value === "object") {
                  navigator.clipboard.writeText(
                    JSON.stringify(ctxMenu.value, null, 2),
                  );
                } else {
                  navigator.clipboard.writeText(String(ctxMenu.value));
                }
                setCtxMenu(null);
              }}
            />
            <CtxMenuItem
              icon={Code}
              label="Extract to Variable"
              onClick={() => {
                setExtractModal({ path: ctxMenu.path });
                setCtxMenu(null);
              }}
            />
          </div>,
          document.body,
        )}

      {extractModal && (
        <ExtractVariableModal
          jsonPath={extractModal.path}
          onClose={() => setExtractModal(null)}
        />
      )}
    </>
  );
}
