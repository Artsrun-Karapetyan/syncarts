import { darkTheme } from "@uiw/react-json-view/dark";
import { vscodeTheme } from "@uiw/react-json-view/vscode";
import type { CSSProperties } from "react";

export type ResponseJsonThemeId = "syncarts" | "postman" | "chrome";

export const responseJsonThemeOptions: Array<{
  value: ResponseJsonThemeId;
  label: string;
}> = [
  { value: "syncarts", label: "Syncarts" },
  { value: "postman", label: "Postman" },
  { value: "chrome", label: "Chrome" },
];

type JsonThemeStyles = CSSProperties & Record<`--${string}`, string | number>;

export const responseJsonThemes: Record<ResponseJsonThemeId, JsonThemeStyles> =
  {
    syncarts: {
      ...darkTheme,
      "--w-rjv-background-color": "transparent",
      "--w-rjv-color": "#e2e8f0",
      "--w-rjv-key-string": "#6366f1",
      "--w-rjv-key-number": "#6366f1",
      "--w-rjv-colon-color": "#64748b",
      "--w-rjv-type-string-color": "#10b981",
      "--w-rjv-type-int-color": "#f59e0b",
      "--w-rjv-type-float-color": "#f59e0b",
      "--w-rjv-type-boolean-color": "#ef4444",
      "--w-rjv-type-null-color": "#64748b",
      "--w-rjv-line-color": "rgba(255, 255, 255, 0.08)",
      "--w-rjv-arrow-color": "#64748b",
      "--w-rjv-info-color": "#64748b",
      "--w-rjv-edit-color": "#6366f1",
      "--w-rjv-update-color": "#6366f1",
      "--w-rjv-copied-color": "#6366f1",
    },
    postman: {
      ...darkTheme,
      "--w-rjv-background-color": "#1e1e1e",
      "--w-rjv-color": "#d4d4d4",
      "--w-rjv-key-string": "#9cdcfe",
      "--w-rjv-key-number": "#9cdcfe",
      "--w-rjv-colon-color": "#d4d4d4",
      "--w-rjv-type-string-color": "#ce9178",
      "--w-rjv-type-int-color": "#b5cea8",
      "--w-rjv-type-float-color": "#b5cea8",
      "--w-rjv-type-boolean-color": "#569cd6",
      "--w-rjv-type-null-color": "#808080",
      "--w-rjv-line-color": "#323232",
      "--w-rjv-arrow-color": "#838383",
      "--w-rjv-info-color": "#656565",
      "--w-rjv-edit-color": "#9cdcfe",
      "--w-rjv-update-color": "#9cdcfe",
      "--w-rjv-copied-color": "#9cdcfe",
    },
    chrome: {
      ...vscodeTheme,
      "--w-rjv-background-color": "#202124",
      "--w-rjv-color": "#f8fafc",
      "--w-rjv-key-string": "#9cdcfe",
      "--w-rjv-colon-color": "#cbd5e1",
      "--w-rjv-type-string-color": "#f8fafc",
      "--w-rjv-type-int-color": "#f8fafc",
      "--w-rjv-type-float-color": "#f8fafc",
      "--w-rjv-type-boolean-color": "#f8fafc",
      "--w-rjv-type-null-color": "#f8fafc",
      "--w-rjv-line-color": "#36334280",
      "--w-rjv-arrow-color": "#838383",
      "--w-rjv-info-color": "#9c9c9c7a",
      "--w-rjv-edit-color": "#9cdcfe",
      "--w-rjv-update-color": "#9cdcfe",
      "--w-rjv-copied-color": "#9cdcfe",
    },
  };
