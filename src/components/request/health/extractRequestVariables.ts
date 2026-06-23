import type { HeaderItem, SavedRequest } from "@/contexts/WorkspaceContext";

const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

export function extractRequestVariables(request: SavedRequest) {
  return Array.from(
    new Set(getVariableTexts(request).flatMap(extractVariables)),
  );
}

function getVariableTexts(request: SavedRequest) {
  const headers = request.headers.flatMap(headerValues);
  const formData = (request.formData || []).flatMap((item) => [
    item.key,
    item.value,
  ]);

  return [
    request.url,
    request.body,
    request.bearerToken || "",
    ...headers,
    ...formData,
  ];
}

function headerValues(header: HeaderItem) {
  return [header.key, header.value];
}

function extractVariables(text: string) {
  const names: string[] = [];
  for (const match of text.matchAll(VARIABLE_REGEX)) {
    names.push(match[1].trim());
  }
  return names;
}
