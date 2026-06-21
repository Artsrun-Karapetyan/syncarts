import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { ImportStatus } from "@/components/workspace/import/importTypes";

interface ImportStatusMessageProps {
  message: string;
  status: Exclude<ImportStatus, "idle">;
}

export function ImportStatusMessage({
  message,
  status,
}: ImportStatusMessageProps) {
  return (
    <div
      data-testid="status-msg"
      style={{
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        fontWeight: 500,
        background:
          status === "success"
            ? "var(--status-get-bg)"
            : "var(--status-delete-bg)",
        color:
          status === "success" ? "var(--status-get)" : "var(--status-delete)",
      }}
    >
      {status === "success" ? (
        <CheckCircle2 size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      {message}
    </div>
  );
}
