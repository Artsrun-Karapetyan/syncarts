import { invoke } from "@tauri-apps/api/core";

import type { HttpResponse } from "../../contexts/workspace/types";

export async function saveResponseToFile(response: HttpResponse) {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const filePath = await save({
    defaultPath: getResponseFileName(response),
  });

  if (!filePath) return;

  await invoke("save_response_body", {
    path: filePath,
    body: response.body,
  });
}

function getResponseFileName(response: HttpResponse) {
  const contentDisposition = getHeader(response.headers, "content-disposition");
  const filename = contentDisposition?.match(
    /filename\*?=(?:UTF-8''|")?([^";]+)/i,
  )?.[1];
  if (filename)
    return sanitizeFileName(
      safeDecodeURIComponent(filename.replace(/^"|"$/g, "")),
    );

  const extension = getExtensionFromContentType(
    getHeader(response.headers, "content-type"),
  );
  return `response-${response.status || "body"}${extension}`;
}

function getHeader(headers: Record<string, string>, key: string) {
  const entry = Object.entries(headers).find(
    ([headerKey]) => headerKey.toLowerCase() === key,
  );
  return entry?.[1] || "";
}

function getExtensionFromContentType(contentType: string) {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "application/json": ".json",
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "text/csv": ".csv",
    "text/html": ".html",
    "text/plain": ".txt",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };

  return map[normalized] || ".txt";
}

function sanitizeFileName(value: string) {
  const sanitized = value
    .split("")
    .map((char) =>
      char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? "_" : char,
    )
    .join("")
    .trim();

  return sanitized || "response.txt";
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
