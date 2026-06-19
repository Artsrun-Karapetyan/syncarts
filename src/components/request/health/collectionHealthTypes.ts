import type { SavedRequest } from "../../../contexts/WorkspaceContext";

export type CollectionHealthIssueCode =
  | "duplicate-request"
  | "empty-url"
  | "missing-variable"
  | "no-docs"
  | "no-examples"
  | "no-tests";

export interface CollectionHealthIssue {
  code: CollectionHealthIssueCode;
  count: number;
  label: string;
  requests: SavedRequest[];
  severity: "error" | "warning";
}

export interface CollectionHealthReport {
  duplicateGroups: number;
  documentedRequests: number;
  requestsWithExamples: number;
  requestsWithTests: number;
  issues: CollectionHealthIssue[];
  requestCount: number;
  score: number;
}
