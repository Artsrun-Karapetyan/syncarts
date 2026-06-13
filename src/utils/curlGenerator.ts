import {
  interpolateVariables,
  resolveRequestAuth,
} from "../contexts/workspace/requests/requestHelpers";
import type {
  Collection,
  Environment,
  EnvironmentVariable,
  TabData,
} from "../contexts/WorkspaceContext";
import { applyPathVariables } from "./pathVariables";

interface CurlGeneratorArgs {
  activeEnvironment?: Environment;
  collections: Collection[];
  globalVariables: EnvironmentVariable[];
  request: TabData;
}

export function generateCurlCommand(args: CurlGeneratorArgs) {
  const { activeEnvironment, collections, globalVariables, request } = args;
  const interpolate = (text: string) =>
    interpolateVariables({
      activeEnvironment,
      activeTab: request,
      collections,
      globalVariables,
      text,
    });

  const pathVariables = request.pathVariables?.map((variable) => ({
    ...variable,
    value: interpolate(variable.value),
  }));
  const url = applyPathVariables(interpolate(request.url || ""), pathVariables);
  const lines = [
    `curl --location ${shellQuote(url || "https://api.example.com")}`,
  ];
  const method = request.method || "GET";

  if (method !== "GET") {
    lines.push(`--request ${method}`);
  }

  for (const [key, value] of buildHeaders(request, collections, interpolate)) {
    if (shouldSkipGeneratedHeader(key, value, request.bodyType)) continue;
    lines.push(`--header ${shellQuote(`${key}: ${value}`)}`);
  }

  for (const bodyLine of buildBodyLines(request, interpolate)) {
    lines.push(bodyLine);
  }

  return lines
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join(" \\\n");
}

function buildHeaders(
  request: TabData,
  collections: Collection[],
  interpolate: (text: string) => string,
) {
  const headers = new Map<string, [string, string]>();

  for (const header of request.headers || []) {
    if (header.enabled === false || !header.key.trim() || !header.value.trim())
      continue;
    const key = interpolate(header.key.trim());
    headers.set(key.toLowerCase(), [key, interpolate(header.value)]);
  }

  const { authType, bearerToken } = resolveRequestAuth(request, collections);
  if (authType === "bearer" && bearerToken) {
    headers.set("authorization", [
      "Authorization",
      `Bearer ${interpolate(bearerToken)}`,
    ]);
  }

  return Array.from(headers.values());
}

function buildBodyLines(
  request: TabData,
  interpolate: (text: string) => string,
) {
  const bodyType = request.bodyType || "raw";
  if (bodyType === "none") return [];

  if (bodyType === "raw") {
    const body = request.body?.trim();
    return body ? [`--data-raw ${shellQuote(interpolate(body))}`] : [];
  }

  const formData = (request.formData || []).filter(
    (item) => item.enabled && item.key.trim(),
  );
  if (bodyType === "x-www-form-urlencoded") {
    return formData.map(
      (item) =>
        `--data-urlencode ${shellQuote(`${interpolate(item.key)}=${interpolate(item.value)}`)}`,
    );
  }

  return formData.flatMap((item) => {
    const key = interpolate(item.key);
    if (item.type === "file") {
      return (item.files || []).map(
        (filePath) => `--form ${shellQuote(`${key}=@${filePath}`)}`,
      );
    }
    return [`--form ${shellQuote(`${key}=${interpolate(item.value)}`)}`];
  });
}

function shouldSkipGeneratedHeader(
  key: string,
  value: string,
  bodyType?: string,
) {
  return (
    bodyType === "form-data" &&
    key.toLowerCase() === "content-type" &&
    value.toLowerCase().includes("multipart/form-data")
  );
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
