import { File, Plus, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { FormDataItem } from "../../../contexts/WorkspaceContext";

interface FileValueEditorProps {
  handleUpdateFormData: (id: string, updates: Partial<FormDataItem>) => void;
  item: FormDataItem;
}

export function FileValueEditor(props: FileValueEditorProps) {
  const { handleUpdateFormData, item } = props;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const fileCount = item.files?.length || 0;

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <button
        className="input"
        style={{
          width: "100%",
          minHeight: 32,
          fontSize: 13,
          background: "transparent",
          textAlign: "left",
          cursor: "pointer",
          color: fileCount ? "var(--text-primary)" : "var(--text-tertiary)",
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          borderRadius: 0,
          margin: "-1px 0 0 -1px",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {fileCount ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-tertiary)",
              padding: "2px 8px",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
            }}
          >
            <File size={12} style={{ color: "var(--text-secondary)" }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {fileCount} file{fileCount > 1 ? "s" : ""} selected
            </span>
          </div>
        ) : (
          <span style={{ color: "var(--text-tertiary)" }}>Select files...</span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="animate-fade-in"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: Math.max(pos.width, 280),
              zIndex: 9999,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-highlight)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {fileCount > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {item.files?.map((file, idx) => {
                  const fileName = file.split(/[/\\]/).pop() || file;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        padding: "4px 8px",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={file}
                      >
                        {fileName}
                      </span>
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          display: "flex",
                          color: "var(--text-tertiary)",
                        }}
                        onClick={() => {
                          const newFiles = [...(item.files || [])];
                          newFiles.splice(idx, 1);
                          handleUpdateFormData(item.id, { files: newFiles });
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--text-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-tertiary)")
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              className="btn"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: "transparent",
                border: "1px dashed var(--border-highlight)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                color: "var(--text-primary)",
                display: "flex",
                justifyContent: "center",
                width: "100%",
                gap: 6,
              }}
              onClick={async () => {
                try {
                  const { open } = await import("@tauri-apps/plugin-dialog");
                  const selected = await open({ multiple: true });
                  if (selected) {
                    const fileArray = Array.isArray(selected)
                      ? selected
                      : [selected];
                    const newPaths = fileArray.map((f: any) => f.path || f);
                    handleUpdateFormData(item.id, {
                      files: [...(item.files || []), ...newPaths],
                    });
                  }
                } catch (err) {
                  console.error("Failed to open dialog", err);
                }
              }}
            >
              <Plus size={14} />
              New file from local machine
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
