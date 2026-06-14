export function extractBearerToken(authorization: string | undefined): string {
  return authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
}
