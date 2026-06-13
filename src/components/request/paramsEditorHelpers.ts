import type { QueryParamItem } from "../../contexts/WorkspaceContext";

const EMPTY_PARAM: QueryParamItem = {
  key: "",
  value: "",
  description: "",
  enabled: true,
};

export function createEmptyParam() {
  return { ...EMPTY_PARAM };
}

export function ensureTrailingBlank(params: QueryParamItem[]) {
  if (params.length === 0) return [createEmptyParam()];
  const last = params[params.length - 1];
  return last.key || last.value || last.description
    ? [...params, createEmptyParam()]
    : params;
}

export function parseParamsFromUrl(
  url: string,
  queryParamDescriptions: Record<string, string>,
) {
  const [, queryString] = url.split("?");
  if (!queryString) return [createEmptyParam()];

  return queryString.split("&").map((pair) => {
    const [k, v] = pair.split("=");
    const key = decodeQueryPart(k || "");
    return {
      key,
      value: decodeQueryPart(v || ""),
      description: queryParamDescriptions[key] || "",
      enabled: true,
    };
  });
}

function decodeQueryPart(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}
