import type {
  Environment,
  EnvironmentVariable,
} from "../../contexts/WorkspaceContext";

export interface ResolvedVariable {
  exists: boolean;
  hasValue: boolean;
  value: string;
  source?: string;
  sourceType?: "Environment" | "Collection" | "Folder" | "Globals" | "Dynamic";
}

export function resolveScopedVariable(args: {
  ancestors?: any[]; // (Collection | Folder)[]
  activeEnvironment?: Environment;
  globalVariables: EnvironmentVariable[];
  varName: string;
}): ResolvedVariable {
  const { ancestors, activeEnvironment, globalVariables, varName } = args;
  const envVar = activeEnvironment?.variables?.find(
    (variable) => variable.key === varName && variable.enabled,
  );
  if (envVar)
    return toResolved(
      envVar,
      activeEnvironment?.name || "Environment",
      "Environment",
    );

  if (ancestors && ancestors.length > 0) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      const ancestorVar = ancestor.variables?.find(
        (variable: any) => variable.key === varName && variable.enabled,
      );
      if (ancestorVar) {
        const type = ancestor.type === "folder" ? "Folder" : "Collection";
        return toResolved(ancestorVar, type, type);
      }
    }
  }

  const globalVar = globalVariables.find(
    (variable) => variable.key === varName && variable.enabled,
  );
  if (globalVar) return toResolved(globalVar, "Globals", "Globals");

  const dynamicValue = resolveDynamicVariable(varName);
  if (dynamicValue !== null) {
    return {
      exists: true,
      hasValue: true,
      value: dynamicValue,
      source: "Dynamic",
      sourceType: "Dynamic",
    };
  }

  return { exists: false, hasValue: false, value: "", source: "Not found" };
}

export function resolveDynamicVariable(key: string): string | null {
  if (key === "$guid") return crypto.randomUUID();
  if (key === "$timestamp") return Math.floor(Date.now() / 1000).toString();
  if (key === "$isoTimestamp") return new Date().toISOString();
  return null;
}

export function upsertActiveVariableValue(
  variables: EnvironmentVariable[],
  key: string,
  value: string,
): EnvironmentVariable[] {
  const activeIndex = variables.findIndex(
    (variable) => variable.key === key && variable.enabled,
  );

  if (activeIndex >= 0) {
    return variables.map((variable, index) =>
      index === activeIndex ? { ...variable, value } : variable,
    );
  }

  return [...variables, { id: crypto.randomUUID(), key, value, enabled: true }];
}

function toResolved(
  variable: EnvironmentVariable,
  source: string,
  sourceType: ResolvedVariable["sourceType"],
): ResolvedVariable {
  return {
    exists: true,
    hasValue: variable.value.length > 0,
    value: variable.value,
    source,
    sourceType,
  };
}
