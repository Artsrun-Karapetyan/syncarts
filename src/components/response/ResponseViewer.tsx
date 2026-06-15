import "./ResponseViewer.css";
import "../request/tabs/RequestTabs.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { ResponseBodyContent } from "./body/ResponseBodyContent";
import { ResponseBodyToolbar } from "./body/ResponseBodyToolbar";
import { ResponseHeadersList } from "./header/ResponseHeadersList";
import { ResponsePanelHeader } from "./header/ResponsePanelHeader";
import { ResponseTestResults } from "./header/ResponseTestResults";
import { cleanClickedUrl } from "./shared/cleanClickedUrl";
import type { ResponseJsonThemeId } from "./shared/responseJsonThemes";
import {
  detectResponseLanguage,
  type ResponseLanguage,
} from "./shared/responseLanguage";
import type { BodyFormat, ResponseTab } from "./shared/responseTypes";
import { ResponseEmptyState } from "./state/ResponseEmptyState";
import { ResponseLoadingState } from "./state/ResponseLoadingState";

export function ResponseViewer() {
  const { activeTab, addTab, addExample, error, isMutating, openExampleTab } =
    useWorkspace();
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

  const handleSaveExample = useCallback(() => {
    if (!activeTab?.savedRequestId || !activeTab?.collectionId) return;
    const status = activeTab.response?.status || 200;
    const exampleId = addExample(
      activeTab.collectionId,
      activeTab.savedRequestId,
      `${status}`,
    );
    window.setTimeout(() => {
      openExampleTab(activeTab.collectionId!, exampleId);
      window.dispatchEvent(
        new CustomEvent("highlight-sidebar", { detail: { exampleId } }),
      );
    });
  }, [activeTab, addExample, openExampleTab]);

  return (
    <div className="glass-panel response-viewer-root">
      <ResponsePanelHeader
        viewTab={viewTab}
        onViewTabChange={setViewTab}
        response={response}
        responseHeaderCount={responseHeaderEntries.length}
        testResults={activeTab?.testResults}
        onSaveExample={handleSaveExample}
        hasSavedRequestId={
          activeTab?.type !== "example" && !!activeTab?.savedRequestId
        }
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
