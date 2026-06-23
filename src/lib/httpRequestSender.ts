import { invoke } from "@tauri-apps/api/core";

import type { HttpResponse } from "@/contexts/workspace/core/types";
import { isTauriRuntime } from "@/lib/tauriRuntime";

export type RequestBodyPayload =
  | { type: "None" }
  | { type: "Raw"; content: string }
  | {
      type: "FormData" | "FormUrlEncoded";
      items: RequestFormItem[];
    };

type RequestFormItem = {
  key: string;
  value: string;
  type?: "text" | "file";
  files?: string[];
};

export type RequestPayload = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: RequestBodyPayload | string | null;
};

export async function sendHttpRequest(
  request: RequestPayload,
): Promise<HttpResponse> {
  if (isTauriRuntime()) {
    return invoke<HttpResponse>("make_request", { request });
  }

  return sendBrowserRequest(request);
}

async function sendBrowserRequest(request: RequestPayload) {
  const startedAt = performance.now();
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: toFetchBody(request.body),
  });
  const body = await response.text();

  return {
    status: response.status,
    status_text: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body,
    time_ms: Math.round(performance.now() - startedAt),
  };
}

export function toFetchBody(body: RequestPayload["body"]) {
  if (!body) return undefined;
  if (typeof body === "string") return body;
  if (body.type === "None") return undefined;
  if (body.type === "Raw") return body.content;
  if (body.type === "FormUrlEncoded") return toUrlEncodedBody(body.items);
  return toFormDataBody(body.items);
}

function toUrlEncodedBody(items: RequestFormItem[]) {
  const params = new URLSearchParams();
  items.forEach((item) => params.append(item.key, item.value));
  return params;
}

function toFormDataBody(items: RequestFormItem[]) {
  const formData = new FormData();
  items.forEach((item) => formData.append(item.key, item.value));
  return formData;
}
