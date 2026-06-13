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

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragging ? "var(--accent-primary)" : "var(--border-color)"}`,
        borderRadius: "var(--radius-md)",
        padding: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: isDragging ? "var(--bg-tertiary)" : "transparent",
        cursor: isProcessing ? "not-allowed" : "pointer",
        opacity: isProcessing ? 0.7 : 1,
        transition: "all var(--transition-fast)",
      }}
    >
      <UploadCloud
        size={32}
        style={{
          color: isDragging ? "var(--accent-primary)" : "var(--text-tertiary)",
        }}
      />
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
            Supports Postman Collection (.json) and Environment (.json)
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
