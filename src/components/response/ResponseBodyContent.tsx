import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import CodeEditor from '@uiw/react-textarea-code-editor';

import type { HttpResponse } from '../../contexts/WorkspaceContext';
import { JsonUrlString } from './JsonUrlString';
import type { ResponseLanguage } from './responseLanguage';
import type { BodyFormat } from './responseTypes';

interface ResponseBodyContentProps {
  bodyFormat: BodyFormat;
  effectiveLanguage: ResponseLanguage;
  isBinary: boolean;
  isImage: boolean;
  jsonCollapsed: number | false;
  parsedBody: unknown;
  response: HttpResponse;
  wrapLines: boolean;
  onJsonClick: (event: React.MouseEvent) => void;
}

export function ResponseBodyContent(props: ResponseBodyContentProps) {
  const {
    bodyFormat,
    effectiveLanguage,
    isBinary,
    isImage,
    jsonCollapsed,
    parsedBody,
    response,
    wrapLines,
    onJsonClick
  } = props;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: isBinary ? 0 : 20 }} onClick={onJsonClick}>
      {isBinary ? (
        <div className="response-binary-preview">
          {isImage ? (
            <img src={response.body} alt="Response Image" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <iframe src={response.body} style={{ width: '100%', height: '100%', border: 'none' }} />
          )}
        </div>
      ) : bodyFormat === 'preview' ? (
        <div className="response-html-preview">
          <iframe srcDoc={response.body} style={{ width: '100%', height: '100%', border: 'none' }} title="Preview" sandbox="allow-scripts allow-same-origin" />
        </div>
      ) : parsedBody && effectiveLanguage === 'json' && bodyFormat === 'pretty' ? (
        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }} className={`json-view-container ${wrapLines ? 'wrap-lines' : ''}`}>
          <JsonView
            value={parsedBody}
            style={jsonThemeStyles}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
            collapsed={jsonCollapsed}
            shortenTextAfterLength={0}
          >
            <JsonUrlString />
          </JsonView>
        </div>
      ) : bodyFormat === 'pretty' && response.body ? (
        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          <CodeEditor
            value={response.body}
            language={effectiveLanguage}
            placeholder="Please enter code."
            disabled
            padding={15}
            style={{
              fontSize: 13,
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
      ) : (
        <pre className="font-mono response-raw-body">{response.body}</pre>
      )}
    </div>
  );
}

const jsonThemeStyles = {
  ...darkTheme,
  '--w-rjv-background-color': 'transparent',
  '--w-rjv-color': 'var(--text-primary)',
  '--w-rjv-key-string': 'var(--accent-primary)',
  '--w-rjv-key-number': 'var(--accent-primary)',
  '--w-rjv-colon-color': 'var(--text-tertiary)',
  '--w-rjv-type-string-color': 'var(--status-get)',
  '--w-rjv-type-int-color': 'var(--status-put)',
  '--w-rjv-type-float-color': 'var(--status-put)',
  '--w-rjv-type-boolean-color': 'var(--status-delete)',
  '--w-rjv-type-null-color': 'var(--text-tertiary)',
  '--w-rjv-line-color': 'var(--border-color)',
  '--w-rjv-arrow-color': 'var(--text-tertiary)',
  '--w-rjv-info-color': 'var(--text-tertiary)',
  '--w-rjv-edit-color': 'var(--accent-primary)',
  '--w-rjv-update-color': 'var(--accent-primary)',
  '--w-rjv-copied-color': 'var(--accent-primary)',
} as React.CSSProperties;
