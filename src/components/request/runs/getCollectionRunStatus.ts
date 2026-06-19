import type { TestResult } from "../../../contexts/WorkspaceContext";

export function getCollectionRunStatus(
  status: number,
  testResults: TestResult[],
) {
  if (status >= 400) return "failed";
  if (testResults.some((test) => !test.passed)) return "failed";
  return "passed";
}
