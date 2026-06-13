import type { PathVariable } from "../contexts/WorkspaceContext";
import { syncPathVariablesWithUrl } from "./pathVariables";

export function parsePostmanPathVariables(
  url: any,
  rawUrl: string,
): PathVariable[] {
  const variables = syncPathVariablesWithUrl(rawUrl, []);
  if (!Array.isArray(url?.variable)) return variables;

  return variables.map((variable) => {
    const source = url.variable.find((item: any) => item.key === variable.key);
    return source
      ? {
          ...variable,
          value: source.value || "",
          description:
            typeof source.description === "string" ? source.description : "",
        }
      : variable;
  });
}

export function buildPostmanPathVariables(variables: PathVariable[] = []) {
  if (variables.length === 0) return undefined;
  return variables.map((variable) => ({
    key: variable.key,
    value: variable.value,
    description: variable.description || undefined,
  }));
}
