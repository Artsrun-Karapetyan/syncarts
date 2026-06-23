const PATH_PARAM_REGEX = /^(:[^/]+|\{[^}]+\})$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getExactDuplicateKey(method: string, url: string) {
  return `${method.toUpperCase()} ${normalizeUrl(url, false)}`;
}

export function getSimilarDuplicateKey(method: string, url: string) {
  return `${method.toUpperCase()} ${normalizeUrl(url, true)}`;
}

function normalizeUrl(url: string, loose: boolean) {
  const [pathPart, queryPart = ""] = stripHost(url).split("?");
  const path = normalizePath(pathPart, loose);
  const query = normalizeQuery(queryPart);
  return query ? `${path}?${query}` : path;
}

function stripHost(url: string) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "/";

  try {
    const parsedUrl = new URL(trimmed);
    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return trimmed
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/^{{[^}]+}}/, "")
      .replace(/^[A-Za-z_][A-Za-z0-9_]*:\/\//, "");
  }
}

function normalizePath(path: string, loose: boolean) {
  const normalized = (path || "/")
    .replace(/\{([^}]+)\}/g, ":$1")
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
  const safePath = normalized.startsWith("/") ? normalized : `/${normalized}`;
  if (!loose) return safePath || "/";

  return safePath
    .split("/")
    .map((segment) => normalizePathSegment(segment))
    .join("/");
}

function normalizePathSegment(segment: string) {
  if (!segment) return segment;
  if (PATH_PARAM_REGEX.test(segment)) return ":param";
  if (/^\d+$/.test(segment)) return ":param";
  if (UUID_REGEX.test(segment)) return ":param";
  return segment.toLowerCase();
}

function normalizeQuery(query: string) {
  if (!query) return "";
  return query
    .split("&")
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .join("&");
}
