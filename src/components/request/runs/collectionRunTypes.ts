import type {
  HttpResponse,
  SavedRequest,
  TabData,
  TestResult,
} from "../../../contexts/WorkspaceContext";

export interface CollectionRunItem {
  folderId: string | null;
  folderPath: string;
  request: SavedRequest;
  tab: TabData;
}

export interface CollectionRunResult {
  durationMs: number;
  error?: string;
  item: CollectionRunItem;
  response?: HttpResponse;
  status: "failed" | "passed";
  testResults: TestResult[];
}
