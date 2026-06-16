export function validateRequestUrl(url: string): string | null {
  if (!url.trim()) {
    return "Request URL is empty.";
  }

  if (/\{\{[^}]+\}\}/.test(url)) {
    return `Unresolved variable in URL: ${url}`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Request URL must start with http:// or https://.";
    }
  } catch {
    return `Invalid request URL: ${url}`;
  }

  return null;
}
