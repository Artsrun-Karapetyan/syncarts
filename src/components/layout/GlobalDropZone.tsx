import React, { useEffect, useRef, useState } from "react";

import { ImportModal } from "../workspace/ImportModal";

export function GlobalDropZone({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();

      // Check if it's a file drag (compatible with WebKit DOMStringList)
      const types = e.dataTransfer?.types
        ? Array.from(e.dataTransfer.types)
        : [];
      const hasFiles =
        types.includes("Files") || types.includes("application/x-moz-file");
      if (hasFiles) {
        dragCounter.current += 1;
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      const types = e.dataTransfer?.types
        ? Array.from(e.dataTransfer.types)
        : [];
      if (types.includes("Files") && e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        setDroppedFile(file);
        setIsModalOpen(true);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setDroppedFile(null), 300);
  };

  return (
    <>
      {children}
      {isDragging && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 25, 20, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 24,
              border: "4px dashed #10b981",
              borderRadius: 24,
              background: "rgba(16, 185, 129, 0.05)",
              boxShadow: "0 0 40px rgba(16, 185, 129, 0.2) inset",
            }}
          />
          <div
            className="glass-panel"
            style={{
              padding: "32px 64px",
              borderRadius: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              transform: "scale(1.05)",
              animation: "pulse-green 2s infinite",
              background: "var(--bg-secondary)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                marginBottom: 8,
                boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Drop file to import
            </div>
            <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>
              Supports Postman Collections, Environments, and cURL JSON
            </div>
          </div>
        </div>
      )}
      <ImportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialFile={droppedFile}
      />
    </>
  );
}
