import type { HttpResponse } from "../core/types";

export function createRequestErrorResponse(message: string): HttpResponse {
  return {
    status: 0,
    status_text: "Request Error",
    headers: {},
    body: message,
    time_ms: 0,
  };
}
