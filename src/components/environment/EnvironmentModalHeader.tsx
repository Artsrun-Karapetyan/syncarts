import { Globe, X } from "lucide-react";

import type { Environment } from "../../contexts/WorkspaceContext";

interface EnvironmentModalHeaderProps {
  isGlobals: boolean;
  selectedEnv?: Environment;
  onClose: () => void;
}

export function EnvironmentModalHeader({
  isGlobals,
  selectedEnv,
  onClose,
}: EnvironmentModalHeaderProps) {
  return (
    <div
      style={{
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {isGlobals && (
          <Globe size={18} style={{ color: "var(--accent-primary)" }} />
        )}
        {isGlobals
          ? "Globals"
          : selectedEnv
            ? selectedEnv.name
            : "Select an environment"}
      </h2>
      <button
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: 4,
        }}
        onClick={onClose}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--text-primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-secondary)")
        }
      >
        <X size={20} />
      </button>
    </div>
  );
}
