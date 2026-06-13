import type { CSSProperties } from 'react';
import { darkTheme } from '@uiw/react-json-view/dark';
import { githubDarkTheme } from '@uiw/react-json-view/githubDark';
import { lightTheme } from '@uiw/react-json-view/light';

export type ResponseJsonThemeId = 'syncarts' | 'postman' | 'chrome';

export const responseJsonThemeOptions: Array<{ value: ResponseJsonThemeId; label: string }> = [
  { value: 'syncarts', label: 'Syncarts' },
  { value: 'postman', label: 'Postman' },
  { value: 'chrome', label: 'Chrome' },
];

type JsonThemeStyles = CSSProperties & Record<`--${string}`, string | number>;

export const responseJsonThemes: Record<ResponseJsonThemeId, JsonThemeStyles> = {
  syncarts: {
    ...darkTheme,
    '--w-rjv-background-color': 'transparent',
    '--w-rjv-color': '#e2e8f0',
    '--w-rjv-key-string': '#6366f1',
    '--w-rjv-key-number': '#6366f1',
    '--w-rjv-colon-color': '#64748b',
    '--w-rjv-type-string-color': '#10b981',
    '--w-rjv-type-int-color': '#f59e0b',
    '--w-rjv-type-float-color': '#f59e0b',
    '--w-rjv-type-boolean-color': '#ef4444',
    '--w-rjv-type-null-color': '#64748b',
    '--w-rjv-line-color': 'rgba(255, 255, 255, 0.08)',
    '--w-rjv-arrow-color': '#64748b',
    '--w-rjv-info-color': '#64748b',
    '--w-rjv-edit-color': '#6366f1',
    '--w-rjv-update-color': '#6366f1',
    '--w-rjv-copied-color': '#6366f1',
  },
  postman: {
    ...githubDarkTheme,
    '--w-rjv-background-color': 'transparent',
    '--w-rjv-color': '#e5e7eb',
    '--w-rjv-key-string': '#f97316',
    '--w-rjv-key-number': '#f97316',
    '--w-rjv-colon-color': '#94a3b8',
    '--w-rjv-type-string-color': '#22c55e',
    '--w-rjv-type-int-color': '#38bdf8',
    '--w-rjv-type-float-color': '#38bdf8',
    '--w-rjv-type-boolean-color': '#a855f7',
    '--w-rjv-type-null-color': '#94a3b8',
    '--w-rjv-line-color': 'rgba(255, 255, 255, 0.09)',
    '--w-rjv-arrow-color': '#94a3b8',
    '--w-rjv-info-color': '#94a3b8',
    '--w-rjv-edit-color': '#f97316',
    '--w-rjv-update-color': '#f97316',
    '--w-rjv-copied-color': '#f97316',
  },
  chrome: {
    ...lightTheme,
    '--w-rjv-background-color': 'transparent',
    '--w-rjv-color': '#d4d4d4',
    '--w-rjv-key-string': '#9cdcfe',
    '--w-rjv-key-number': '#9cdcfe',
    '--w-rjv-colon-color': '#808080',
    '--w-rjv-type-string-color': '#ce9178',
    '--w-rjv-type-int-color': '#b5cea8',
    '--w-rjv-type-float-color': '#b5cea8',
    '--w-rjv-type-boolean-color': '#569cd6',
    '--w-rjv-type-null-color': '#808080',
    '--w-rjv-line-color': 'rgba(255, 255, 255, 0.08)',
    '--w-rjv-arrow-color': '#808080',
    '--w-rjv-info-color': '#808080',
    '--w-rjv-edit-color': '#9cdcfe',
    '--w-rjv-update-color': '#9cdcfe',
    '--w-rjv-copied-color': '#9cdcfe',
  },
};
