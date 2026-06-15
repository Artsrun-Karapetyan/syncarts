/* eslint-disable react/no-multi-comp */
import { FolderPlus, Globe, Plus, Terminal } from "lucide-react";

interface WorkspaceEmptyStateProps {
  onAddTab: (data?: any) => void;
}

const RequestCard = ({
  icon: Icon,
  color,
  title,
  description,
  onClick,
}: any) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 12,
      padding: 24,
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
      borderRadius: 20,
      cursor: "pointer",
      transition: "all var(--transition-fast)",
      width: "100%",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "var(--bg-tertiary)";
      e.currentTarget.style.borderColor = "var(--border-highlight)";
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.2)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "var(--bg-secondary)";
      e.currentTarget.style.borderColor = "var(--border-color)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={24} />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </div>
  </div>
);

const HttpMethodsCard = ({ onAddTab }: any) => {
  const methods = [
    { name: "GET", color: "#10b981" },
    { name: "POST", color: "#3b82f6" },
    { name: "PUT", color: "#f59e0b" },
    { name: "PATCH", color: "#8b5cf6" },
    { name: "DELETE", color: "#ef4444" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 24,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 20,
        gridColumn: "1 / -1",
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-tertiary)";
        e.currentTarget.style.borderColor = "var(--border-highlight)";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-secondary)";
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `color-mix(in srgb, var(--text-primary) 10%, transparent)`,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Globe size={24} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            HTTP Request
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Select a method to instantly create a new request
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
        {methods.map((m) => (
          <button
            key={m.name}
            onClick={() => onAddTab({ method: m.name })}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: `color-mix(in srgb, ${m.color} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${m.color} 20%, transparent)`,
              color: m.color,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `color-mix(in srgb, ${m.color} 20%, transparent)`;
              e.currentTarget.style.borderColor = m.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `color-mix(in srgb, ${m.color} 10%, transparent)`;
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${m.color} 20%, transparent)`;
            }}
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export function WorkspaceEmptyState({ onAddTab }: WorkspaceEmptyStateProps) {
  const triggerEvent = (name: string) => {
    window.dispatchEvent(new Event(name));
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        color: "var(--text-secondary)",
        padding: 40,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Create a new request
        </div>
        <div style={{ fontSize: 15, color: "var(--text-tertiary)" }}>
          Choose an action to start building your API call
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          maxWidth: 600,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <HttpMethodsCard onAddTab={onAddTab} />

        <RequestCard
          icon={Terminal}
          color="#3b82f6"
          title="Import from cURL"
          description="Instantly import requests from cURL commands."
          onClick={() => triggerEvent("syncarts:open-import")}
        />
        <RequestCard
          icon={FolderPlus}
          color="#8b5cf6"
          title="New Collection"
          description="Create a new collection to organize your requests."
          onClick={() => triggerEvent("syncarts:create-collection")}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: "8px 16px",
          borderRadius: 999,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 600,
          transition: "all var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-tertiary)";
          e.currentTarget.style.borderColor = "var(--border-highlight)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-secondary)";
          e.currentTarget.style.borderColor = "var(--border-color)";
        }}
        onClick={() => onAddTab({})}
      >
        <Plus size={16} />
        Blank Request
      </div>
    </div>
  );
}
