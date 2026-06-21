import { Globe, Plus, Trash2, Upload } from "lucide-react";
import type { RefObject } from "react";

import { EnvironmentNavItem } from "@/components/environment/sidebar/EnvironmentNavItem";
import { EnvironmentIconButton } from "@/components/environment/ui/EnvironmentIconButton";
import type { Environment } from "@/contexts/WorkspaceContext";

interface EnvironmentSidebarProps {
  environments: Environment[];
  selectedEnvId: string | null;
  isCreatingEnv: boolean;
  newEnvName: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  setSelectedEnvId: (id: string | null) => void;
  setIsCreatingEnv: (value: boolean) => void;
  setNewEnvName: (value: string) => void;
  createEnvironment: (name: string) => string;
  deleteEnvironment: (id: string) => void;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EnvironmentSidebar({
  environments,
  selectedEnvId,
  isCreatingEnv,
  newEnvName,
  fileInputRef,
  setSelectedEnvId,
  setIsCreatingEnv,
  setNewEnvName,
  createEnvironment,
  deleteEnvironment,
  handleImportFile,
}: EnvironmentSidebarProps) {
  const submitNewEnvironment = () => {
    if (!newEnvName.trim()) return;
    const id = createEnvironment(newEnvName.trim());
    setSelectedEnvId(id);
    setNewEnvName("");
    setIsCreatingEnv(false);
  };

  return (
    <div
      style={{
        width: 240,
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Environments
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".json"
            onChange={handleImportFile}
          />
          <EnvironmentIconButton
            tooltip="Import Postman Environment"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
          </EnvironmentIconButton>
          <EnvironmentIconButton
            tooltip="New Environment"
            onClick={() => {
              setIsCreatingEnv(true);
              setNewEnvName("");
            }}
          >
            <Plus size={16} />
          </EnvironmentIconButton>
        </div>
      </div>
      {isCreatingEnv && (
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderBottom: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
          }}
        >
          <input
            autoFocus
            className="input"
            style={{ width: "100%", fontSize: 13 }}
            placeholder="Environment name..."
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewEnvironment();
              if (e.key === "Escape") {
                setIsCreatingEnv(false);
                setNewEnvName("");
              }
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              className="btn"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={() => {
                setIsCreatingEnv(false);
                setNewEnvName("");
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={submitNewEnvironment}
            >
              Create
            </button>
          </div>
        </div>
      )}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <EnvironmentNavItem
          active={selectedEnvId === "globals"}
          onClick={() => setSelectedEnvId("globals")}
        >
          <Globe size={14} style={{ color: "var(--accent-primary)" }} />
          Globals
        </EnvironmentNavItem>
        {environments.map((env) => (
          <EnvironmentNavItem
            key={env.id}
            active={selectedEnvId === env.id}
            onClick={() => setSelectedEnvId(env.id)}
          >
            {env.name}
            <Trash2
              size={14}
              style={{
                opacity: selectedEnvId === env.id ? 0.8 : 0,
                cursor: "pointer",
                marginLeft: "auto",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete environment "${env.name}"?`)) {
                  deleteEnvironment(env.id);
                  if (selectedEnvId === env.id) setSelectedEnvId(null);
                }
              }}
            />
          </EnvironmentNavItem>
        ))}
        {environments.length === 0 && (
          <div
            style={{
              padding: "16px 8px",
              fontSize: 13,
              color: "var(--text-tertiary)",
              textAlign: "center",
            }}
          >
            No environments
          </div>
        )}
      </div>
    </div>
  );
}
