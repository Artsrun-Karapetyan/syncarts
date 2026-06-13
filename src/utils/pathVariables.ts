import type { PathVariable } from "../contexts/WorkspaceContext";

const PATH_VARIABLE_REGEX = /(^|\/):([A-Za-z_][A-Za-z0-9_]*)/g;

export function extractPathVariableKeys(url: string): string[] {
  const baseUrl = (url || "").split("?")[0];
  const keys: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = PATH_VARIABLE_REGEX.exec(baseUrl)) !== null) {
    const key = match[2];
    if (!keys.includes(key)) keys.push(key);
  }

  return keys;
}

export function syncPathVariablesWithUrl(
  url: string,
  variables: PathVariable[] = [],
): PathVariable[] {
  const keys = extractPathVariableKeys(url);
  return keys.map((key) => {
    const existing = variables.find((variable) => variable.key === key);
    return (
      existing || { id: crypto.randomUUID(), key, value: "", description: "" }
    );
  });
}

export function upsertPathVariable(
  variables: PathVariable[] | undefined,
  key: string,
  value: string,
  description?: string,
): PathVariable[] {
  const currentVariables = variables ?? [];
  const exists = currentVariables.some((variable) => variable.key === key);
  if (!exists) {
    return [
      ...currentVariables,
      { id: crypto.randomUUID(), key, value, description: description || "" },
    ];
  }

  return currentVariables.map((variable) =>
    variable.key === key
      ? { ...variable, value, description: description ?? variable.description }
      : variable,
  );
}

export function applyPathVariables(
  url: string,
  variables: PathVariable[] = [],
): string {
  if (!url || variables.length === 0) return url;

  return url.replace(
    PATH_VARIABLE_REGEX,
    (match, prefix: string, key: string) => {
      const variable = variables.find((item) => item.key === key);
      if (!variable?.value) return match;
      return `${prefix}${encodeURIComponent(variable.value)}`;
    },
  );
}
