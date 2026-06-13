import "./ResponseViewer.css";
import "../request/RequestTabs.css";

import { useEffect, useMemo, useState } from "react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { cleanClickedUrl } from "./cleanClickedUrl";
import { ResponseBodyContent } from "./ResponseBodyContent";
import { ResponseBodyToolbar } from "./ResponseBodyToolbar";
import { ResponseEmptyState } from "./ResponseEmptyState";
import { ResponseHeadersList } from "./ResponseHeadersList";
import type { ResponseJsonThemeId } from "./responseJsonThemes";
import {
  detectResponseLanguage,
  type ResponseLanguage,
} from "./responseLanguage";
import { ResponseLoadingState } from "./ResponseLoadingState";
import { ResponsePanelHeader } from "./ResponsePanelHeader";
import { ResponseTestResults } from "./ResponseTestResults";
import type { BodyFormat, ResponseTab } from "./responseTypes";

export function ResponseViewer() {
  const { activeTab, addTab, error, isMutating } = useWorkspace();
  const response = activeTab?.response;
  const [viewTab, setViewTab] = useState<ResponseTab>("body");
  const [bodyFormat, setBodyFormat] = useState<BodyFormat>("pretty");
  const [language, setLanguage] = useState<ResponseLanguage | "auto">("auto");
  const [jsonCollapsed, setJsonCollapsed] = useState<number | false>(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [jsonTheme, setJsonTheme] = useState<ResponseJsonThemeId>("syncarts");

  const contentType = (
    response?.headers?.["content-type"] ||
    response?.headers?.["Content-Type"] ||
    ""
  ).toLowerCase();
  const isImage = contentType.startsWith("image/");
  const isPdf = contentType.startsWith("application/pdf");
  const isBinary = isImage || isPdf;

  const parsedBody = useMemo(() => {
    if (!response?.body || isBinary) return null;
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }, [response?.body, isBinary]);

  const detectedLanguage = useMemo(
    () => detectResponseLanguage(contentType, response?.body, !!parsedBody),
    [contentType, response?.body, parsedBody],
  );
  const effectiveLanguage: ResponseLanguage =
    language === "auto" ? detectedLanguage : language;
  const responseHeaderEntries = response?.headers
    ? Object.entries(response.headers)
    : [];

  useEffect(() => {
    if (!response) return;
    setLanguage(detectedLanguage);
    setBodyFormat(detectedLanguage === "html" ? "preview" : "pretty");
    setJsonCollapsed(false);
  }, [response?.body, response?.status, response?.time_ms, detectedLanguage]);

  const handleJsonClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const linkTarget = target.closest<HTMLElement>("[data-url]");
    const clickedText = linkTarget?.dataset.url || target.innerText;
    if (
      target.tagName !== "SPAN" ||
      (!clickedText.includes("http://") && !clickedText.includes("https://"))
    )
      return;

    const url = cleanClickedUrl(clickedText);
    if (!url.startsWith("http")) return;

    if (event.metaKey || event.ctrlKey) {
      import("@tauri-apps/plugin-opener").then((opener) => opener.openUrl(url));
      return;
    }

    addTab({
      id: crypto.randomUUID(),
      name: url.split("/").pop() || "New Request",
      method: "GET",
      url,
      bodyType: "none",
      headers: [],
      authType: "none",
    });
  };

  return (
    <div className="glass-panel response-viewer-root">
      <ResponsePanelHeader
        viewTab={viewTab}
        onViewTabChange={setViewTab}
        response={response}
        responseHeaderCount={responseHeaderEntries.length}
        testResults={activeTab?.testResults}
      />

      <div className="response-viewer-content">
        {isMutating && <ResponseLoadingState />}
        {!isMutating && !!error && (
          <div style={{ padding: 24 }}>
            <div className="response-error-box">{String(error)}</div>
          </div>
        )}

        {!isMutating && !error && response && viewTab === "body" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            {!isBinary && (
              <ResponseBodyToolbar
                bodyFormat={bodyFormat}
                effectiveLanguage={effectiveLanguage}
                hasJsonBody={!!parsedBody && effectiveLanguage === "json"}
                jsonCollapsed={jsonCollapsed}
                searchText={response.body || ""}
                jsonTheme={jsonTheme}
                wrapLines={wrapLines}
                onBodyFormatChange={setBodyFormat}
                onJsonCollapsedChange={setJsonCollapsed}
                onJsonThemeChange={setJsonTheme}
                onLanguageChange={setLanguage}
                onWrapLinesChange={setWrapLines}
              />
            )}
            <ResponseBodyContent
              bodyFormat={bodyFormat}
              effectiveLanguage={effectiveLanguage}
              isBinary={isBinary}
              isImage={isImage}
              jsonCollapsed={jsonCollapsed}
              jsonTheme={jsonTheme}
              parsedBody={parsedBody}
              response={response}
              wrapLines={wrapLines}
              onJsonClick={handleJsonClick}
            />
          </div>
        )}

        {!isMutating && !error && response && viewTab === "headers" && (
          <ResponseHeadersList headers={responseHeaderEntries} />
        )}
        {viewTab === "test-results" && (
          <ResponseTestResults
            testResults={activeTab?.testResults}
            consoleLogs={activeTab?.consoleLogs}
          />
        )}
        {!isMutating && !error && !response && <ResponseEmptyState />}
      </div>
    </div>
  );
}
