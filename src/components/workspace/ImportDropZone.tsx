import "@/components/workspace/ImportDropZone.css";

import { UploadCloud } from "lucide-react";

interface ImportDropZoneProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  isProcessing: boolean;
  onDragEnter: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImportDropZone(props: ImportDropZoneProps) {
  const {
    fileInputRef,
    isDragging,
    isProcessing,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFileSelect,
  } = props;
  const openFilePicker = () => {
    if (!isProcessing) fileInputRef.current?.click();
  };

  return (
    <div
      className="syncarts-import-drop-zone"
      data-dragging={isDragging ? "true" : "false"}
      data-processing={isProcessing ? "true" : "false"}
      role="button"
      tabIndex={isProcessing ? -1 : 0}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={openFilePicker}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openFilePicker();
      }}
      style={{
        opacity: isProcessing ? 0.7 : 1,
      }}
    >
      <UploadCloud className="syncarts-import-drop-zone__icon" size={32} />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {isProcessing
            ? "Importing File..."
            : "Drop files here or click to browse"}
        </div>
        {!isProcessing && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Supports Postman, OpenAPI, and Environment JSON
          </div>
        )}
      </div>
      <input
        type="file"
        accept=".json"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={onFileSelect}
        disabled={isProcessing}
      />
    </div>
  );
}
