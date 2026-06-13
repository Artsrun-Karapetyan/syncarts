import { Clock, Zap } from "lucide-react";

import type {
  HttpResponse,
  TestResult,
} from "../../../contexts/WorkspaceContext";
import type { ResponseTab } from "../shared/responseTypes";
import { ResponseHeaderTab } from "./ResponseHeaderTab";
import { formatStatusText, getStatusClass } from "./responsePanelHeaderHelpers";

interface ResponsePanelHeaderProps {
  viewTab: ResponseTab;
  onViewTabChange: (tab: ResponseTab) => void;
  response: HttpResponse | null | undefined;
  responseHeaderCount: number;
  testResults?: TestResult[];
}

export function ResponsePanelHeader(props: ResponsePanelHeaderProps) {
  const {
    viewTab,
    onViewTabChange,
    response,
    responseHeaderCount,
    testResults,
  } = props;

  return (
    <div className="response-panel-header">
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <ResponseHeaderTab
          id="body"
          label="Body"
          activeTab={viewTab}
          onChange={onViewTabChange}
        />
        <ResponseHeaderTab
          id="headers"
          label="Headers"
          activeTab={viewTab}
          onChange={onViewTabChange}
          badge={responseHeaderCount || undefined}
        />
        <ResponseHeaderTab
          id="test-results"
          label="Test Results"
          activeTab={viewTab}
          onChange={onViewTabChange}
          badge={
            testResults?.length
              ? `${testResults.filter((t) => t.passed).length}/${testResults.length}`
              : undefined
          }
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {response ? (
          <>
            <span className={`status-pill ${getStatusClass(response.status)}`}>
              <Zap size={11} />
              {response.status}{" "}
              {formatStatusText(response.status, response.status_text)}
            </span>
            <span className="font-mono response-time">
              <Clock size={11} style={{ opacity: 0.6 }} />
              {response.time_ms} ms
            </span>
          </>
        ) : (
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--text-tertiary)" }}
          >
            - no response
          </span>
        )}
      </div>
    </div>
  );
}
