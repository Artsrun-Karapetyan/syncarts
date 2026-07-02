import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { EnvironmentSidebar } from "@/components/environment/sidebar/EnvironmentSidebar";
import { EnvironmentVariablesTable } from "@/components/environment/table/EnvironmentVariablesTable";
import { EnvironmentModalHeader } from "@/components/environment/ui/EnvironmentModalHeader";
import { EnvironmentVariable, useWorkspace } from "@/contexts/WorkspaceContext";
import { importPostmanEnvironment } from "@/utils/postmanParser";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EnvironmentManager({ isOpen, onClose }: Props) {
  const {
    environments,
    globalVariables,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    updateGlobalVariables,
  } = useWorkspace();
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>("globals");
  const [isCreatingEnv, setIsCreatingEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !selectedEnvId) setSelectedEnvId("globals");
  }, [isOpen, selectedEnvId]);

  if (!isOpen) return null;

  const isGlobals = selectedEnvId === "globals";
  const selectedEnv = isGlobals
    ? undefined
    : environments.find((e) => e.id === selectedEnvId);
  const currentVariables = isGlobals
    ? globalVariables
    : selectedEnv?.variables || [];

  const handleAddVariable = () => {
    const newVar: EnvironmentVariable = {
      id: crypto.randomUUID(),
      key: "",
      value: "",
      enabled: true,
    };
    if (isGlobals) updateGlobalVariables([...globalVariables, newVar]);
    else if (selectedEnv) {
      updateEnvironment(selectedEnv.id, {
        variables: [...selectedEnv.variables, newVar],
      });
    }
  };

  const handleUpdateVariable = (
    varId: string,
    updates: Partial<EnvironmentVariable>,
  ) => {
    if (isGlobals) {
      updateGlobalVariables(
        globalVariables.map((v) => (v.id === varId ? { ...v, ...updates } : v)),
      );
    } else if (selectedEnv) {
      updateEnvironment(selectedEnv.id, {
        variables: selectedEnv.variables.map((v) =>
          v.id === varId ? { ...v, ...updates } : v,
        ),
      });
    }
  };

  const handleDeleteVariable = (varId: string) => {
    if (isGlobals)
      updateGlobalVariables(globalVariables.filter((v) => v.id !== varId));
    else if (selectedEnv) {
      updateEnvironment(selectedEnv.id, {
        variables: selectedEnv.variables.filter((v) => v.id !== varId),
      });
    }
  };

  const handleReplaceVariables = (next: EnvironmentVariable[]) => {
    if (isGlobals) updateGlobalVariables(next);
    else if (selectedEnv)
      updateEnvironment(selectedEnv.id, { variables: next });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsedEnv = importPostmanEnvironment(json);
        createEnvironment(parsedEnv.name, parsedEnv.variables);
      } catch (err) {
        console.error("Failed to import environment:", err);
        alert(
          "Failed to import environment. Make sure it is a valid Postman Environment format.",
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "90vw",
          maxWidth: 800,
          height: "85vh",
          maxHeight: 600,
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <EnvironmentSidebar
          environments={environments}
          selectedEnvId={selectedEnvId}
          isCreatingEnv={isCreatingEnv}
          newEnvName={newEnvName}
          fileInputRef={fileInputRef}
          setSelectedEnvId={setSelectedEnvId}
          setIsCreatingEnv={setIsCreatingEnv}
          setNewEnvName={setNewEnvName}
          createEnvironment={createEnvironment}
          deleteEnvironment={deleteEnvironment}
          handleImportFile={handleImportFile}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-primary)",
          }}
        >
          <EnvironmentModalHeader
            isGlobals={isGlobals}
            selectedEnv={selectedEnv}
            onClose={onClose}
          />
          <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
            {isGlobals || selectedEnv ? (
              <EnvironmentVariablesTable
                isGlobals={isGlobals}
                currentVariables={currentVariables}
                handleAddVariable={handleAddVariable}
                handleUpdateVariable={handleUpdateVariable}
                handleDeleteVariable={handleDeleteVariable}
                handleReplaceVariables={handleReplaceVariables}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                }}
              >
                Select an environment or Globals to manage variables.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
