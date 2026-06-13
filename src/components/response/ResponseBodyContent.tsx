import JsonView from "@uiw/react-json-view";
import CodeEditor from "@uiw/react-textarea-code-editor";

import type { HttpResponse } from "../../contexts/WorkspaceContext";
import { JsonUrlString } from "./JsonUrlString";
import {
  type ResponseJsonThemeId,
  responseJsonThemes,
} from "./responseJsonThemes";
import type { ResponseLanguage } from "./responseLanguage";
import type { BodyFormat } from "./responseTypes";

interface ResponseBodyContentProps {
  bodyFormat: BodyFormat;
  effectiveLanguage: ResponseLanguage;
  isBinary: boolean;
  isImage: boolean;
  jsonCollapsed: number | false;
  jsonTheme: ResponseJsonThemeId;
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
    jsonTheme,
    parsedBody,
    response,
    wrapLines,
    onJsonClick,
  } = props;

  return (
    <div
      style={{ flex: 1, overflow: "auto", padding: isBinary ? 0 : 20 }}
      onClick={onJsonClick}
    >
      {isBinary ? (
        <div className="response-binary-preview">
          {isImage ? (
            <img
              src={response.body}
              alt="Response Image"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <iframe
              src={response.body}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>
      ) : bodyFormat === "preview" ? (
        <div className="response-html-preview">
          <iframe
            srcDoc={response.body}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : parsedBody &&
        effectiveLanguage === "json" &&
        bodyFormat === "pretty" ? (
        <div
          style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}
          className={`json-view-container ${wrapLines ? "wrap-lines" : ""}`}
        >
          <JsonView
            value={parsedBody}
            style={responseJsonThemes[jsonTheme]}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
            collapsed={jsonCollapsed}
            shortenTextAfterLength={0}
          >
            <JsonUrlString />
          </JsonView>
        </div>
      ) : bodyFormat === "pretty" && response.body ? (
        <div style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>
          <CodeEditor
            value={response.body}
            language={effectiveLanguage}
            placeholder="Please enter code."
            disabled
            padding={15}
            style={{
              fontSize: 13,
              backgroundColor: "transparent",
              fontFamily: "var(--font-mono)",
            }}
          />
        </div>
      ) : (
        <pre className="font-mono response-raw-body">{response.body}</pre>
      )}
    </div>
  );
}
