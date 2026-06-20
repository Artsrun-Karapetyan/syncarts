import type {
  Collection,
  EnvironmentVariable,
  HeaderItem,
  PathVariable,
  QueryParamItem,
  SavedExample,
  SavedRequest,
} from "@/contexts/WorkspaceContext";
import {
  groupOpenApiRequestsByTag,
  type OpenApiTaggedRequest,
} from "@/utils/openapi/groupOpenApiRequestsByTag";

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
] as const;

export function parseOpenApiCollection(
  jsonString: string,
): Omit<Collection, "id"> {
  const data = JSON.parse(jsonString);
  if (!isOpenApiDocument(data)) {
    throw new Error("Invalid OpenAPI format");
  }

  const serverUrl = getServerUrl(data);
  const requests = parseRequests(data, serverUrl ? "{{base_url}}" : "");

  return {
    name: data.info?.title || "OpenAPI Import",
    description: data.info?.description || "",
    items: groupOpenApiRequestsByTag(requests),
    variables: serverUrl ? [createBaseUrlVariable(serverUrl)] : undefined,
  };
}

function isOpenApiDocument(data: any) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.openapi === "string" &&
    data.info &&
    data.paths &&
    typeof data.paths === "object"
  );
}

function getServerUrl(data: any) {
  const server = Array.isArray(data.servers) ? data.servers[0] : null;
  return typeof server?.url === "string" ? server.url.replace(/\/$/, "") : "";
}

function createBaseUrlVariable(value: string): EnvironmentVariable {
  return {
    id: crypto.randomUUID(),
    key: "base_url",
    value,
    enabled: true,
  };
}

function parseRequests(data: any, baseUrl: string) {
  const requests: OpenApiTaggedRequest[] = [];

  for (const [path, pathItem] of Object.entries<any>(data.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") continue;

      requests.push(
        parseOperation({
          baseUrl,
          data,
          method: method.toUpperCase(),
          operation,
          path,
          pathParameters: pathItem.parameters,
        }),
      );
    }
  }

  return requests;
}

function parseOperation(args: {
  baseUrl: string;
  data: any;
  method: string;
  operation: any;
  path: string;
  pathParameters: any;
}): SavedRequest & { tagName?: string } {
  const { baseUrl, data, method, operation, path, pathParameters } = args;
  const parameters = [
    ...parseParameterList(data, pathParameters),
    ...parseParameterList(data, operation.parameters),
  ];
  const queryParams = parameters.filter((param) => param.in === "query");
  const headerParams = parameters.filter((param) => param.in === "header");
  const pathParams = parameters.filter((param) => param.in === "path");
  const parsedBody = parseRequestBody(data, operation.requestBody);
  const urlPath = toSyncartsPath(path);
  const query = buildQueryString(queryParams);
  const headers = buildHeaders(headerParams, parsedBody.contentType);

  return {
    type: "request",
    id: crypto.randomUUID(),
    name: operation.summary || operation.operationId || `${method} ${path}`,
    method,
    url: `${baseUrl}${urlPath}${query}`,
    headers,
    body: parsedBody.body,
    bodyType: parsedBody.body ? "raw" : "none",
    description: operation.description || operation.summary || "",
    pathVariables: buildPathVariables(urlPath, pathParams),
    queryParams: buildQueryParams(queryParams),
    examples: parseResponseExamples(data, operation.responses),
    tagName: Array.isArray(operation.tags) ? operation.tags[0] : undefined,
  };
}

function parseParameterList(data: any, parameters: any) {
  if (!Array.isArray(parameters)) return [];
  return parameters
    .map((parameter) => resolveRef(data, parameter))
    .filter((parameter) => parameter && typeof parameter === "object");
}

function parseRequestBody(data: any, requestBody: any) {
  const resolvedBody = resolveRef(data, requestBody);
  const content = resolvedBody?.content;
  const contentType = getPreferredContentType(content);
  if (!contentType) return { body: "", contentType: "" };

  const media = content[contentType];
  const example = getMediaExample(data, media);
  return {
    body: stringifyExample(example),
    contentType,
  };
}

function getPreferredContentType(content: any) {
  if (!content || typeof content !== "object") return "";
  if (content["application/json"]) return "application/json";
  return Object.keys(content)[0] || "";
}

function getMediaExample(data: any, media: any): unknown {
  if (!media || typeof media !== "object") return "";
  if (media.example !== undefined) return media.example;

  const firstExample = Object.values<any>(media.examples || {})[0];
  if (firstExample) {
    const resolvedExample = resolveRef(data, firstExample);
    if (resolvedExample?.value !== undefined) return resolvedExample.value;
  }

  return exampleFromSchema(data, media.schema);
}

function stringifyExample(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function exampleFromSchema(data: any, schema: any, depth = 0): unknown {
  const resolvedSchema = resolveRef(data, schema);
  if (!resolvedSchema || depth > 6) return "";
  if (resolvedSchema.example !== undefined) return resolvedSchema.example;
  if (resolvedSchema.default !== undefined) return resolvedSchema.default;

  if (resolvedSchema.enum?.length) return resolvedSchema.enum[0];

  const type = getSchemaType(resolvedSchema);
  if (type === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, property] of Object.entries<any>(
      resolvedSchema.properties || {},
    )) {
      output[key] = exampleFromSchema(data, property, depth + 1);
    }
    return output;
  }
  if (type === "array") {
    return [exampleFromSchema(data, resolvedSchema.items, depth + 1)];
  }
  if (type === "integer" || type === "number") return 0;
  if (type === "boolean") return false;
  return "";
}

function getSchemaType(schema: any) {
  if (schema.type) return schema.type;
  if (schema.properties) return "object";
  if (schema.items) return "array";
  return "string";
}

function resolveRef(data: any, value: any): any {
  if (!value?.$ref || typeof value.$ref !== "string") return value;
  if (!value.$ref.startsWith("#/")) return value;

  return value.$ref
    .slice(2)
    .split("/")
    .reduce((current: any, part: string) => current?.[part], data);
}

function toSyncartsPath(path: string) {
  return path.replace(/\{([^}]+)\}/g, ":$1");
}

function buildQueryString(parameters: any[]) {
  const enabledParams = parameters.filter((parameter) => parameter.name);
  if (enabledParams.length === 0) return "";

  const params = enabledParams.map((parameter) => {
    const value = getParameterValue(parameter);
    return `${encodeURIComponent(parameter.name)}=${encodeURIComponent(value)}`;
  });
  return `?${params.join("&")}`;
}

function buildQueryParams(parameters: any[]): QueryParamItem[] | undefined {
  if (parameters.length === 0) return undefined;
  return parameters.map((parameter) => ({
    key: parameter.name || "",
    value: getParameterValue(parameter),
    description: parameter.description || "",
    enabled: parameter.deprecated !== true,
  }));
}

function buildPathVariables(
  path: string,
  parameters: any[],
): PathVariable[] | undefined {
  const keys = Array.from(path.matchAll(/\/:([A-Za-z_][A-Za-z0-9_]*)/g)).map(
    (match) => match[1],
  );
  if (keys.length === 0) return undefined;

  return keys.map((key) => {
    const parameter = parameters.find((item) => item.name === key);
    return {
      id: crypto.randomUUID(),
      key,
      value: parameter ? getParameterValue(parameter) : "",
      description: parameter?.description || "",
    };
  });
}

function getParameterValue(parameter: any) {
  const value =
    parameter.example ??
    parameter.schema?.example ??
    parameter.schema?.default ??
    "";
  return String(value);
}

function buildHeaders(parameters: any[], contentType: string): HeaderItem[] {
  const headers = parameters.map((parameter) => ({
    key: parameter.name || "",
    value: getParameterValue(parameter),
    description: parameter.description || "",
    enabled: parameter.deprecated !== true,
  }));

  if (contentType) {
    headers.unshift({
      key: "Content-Type",
      value: contentType,
      description: "",
      enabled: true,
    });
  }

  return headers.length > 0 ? headers : [{ key: "", value: "", enabled: true }];
}

function parseResponseExamples(data: any, responses: any): SavedExample[] {
  if (!responses || typeof responses !== "object") return [];

  return Object.entries<any>(responses)
    .map(([code, response]) => parseResponseExample(data, code, response))
    .filter((example): example is SavedExample => Boolean(example));
}

function parseResponseExample(
  data: any,
  code: string,
  response: any,
): SavedExample | null {
  const resolvedResponse = resolveRef(data, response);
  const contentType = getPreferredContentType(resolvedResponse?.content);
  if (!contentType) return null;

  const body = stringifyExample(
    getMediaExample(data, resolvedResponse.content[contentType]),
  );
  return {
    id: crypto.randomUUID(),
    name: `${code} ${resolvedResponse.description || "Response"}`,
    code: Number(code) || 0,
    status: resolvedResponse.description || "",
    body,
    headers: [{ key: "Content-Type", value: contentType, enabled: true }],
  };
}
