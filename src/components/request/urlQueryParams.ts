export function parseQueryParamsFromUrl(
  url: string,
  descriptions: Record<string, string>,
) {
  const [, queryString] = url.split("?");
  if (!queryString) return [];

  return queryString
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const [k, ...rest] = pair.split("=");
      const key = decodeQueryPart(k || "");
      return {
        key,
        value: decodeQueryPart(rest.join("=") || ""),
        description: descriptions[key] || "",
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
