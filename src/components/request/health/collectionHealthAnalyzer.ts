import type {
  Collection,
  EnvironmentVariable,
  Folder,
  SavedRequest,
} from "../../../contexts/WorkspaceContext";
import { findRequestDuplicateGroups } from "../duplicates/requestDuplicateDetector";
import { resolveDynamicVariable } from "../variables/variableResolution";
import type {
  CollectionHealthIssue,
  CollectionHealthReport,
} from "./collectionHealthTypes";
import { extractRequestVariables } from "./extractRequestVariables";

interface RequestContext {
  inheritedTestScript: string;
  request: SavedRequest;
  variables: EnvironmentVariable[];
}

export function analyzeCollectionHealth(
  collection: Collection,
): CollectionHealthReport {
  const requestContexts = flattenRequests(collection.items, {
    inheritedTestScript: collection.testScript || "",
    variables: collection.variables || [],
  });
  const duplicateGroups = findRequestDuplicateGroups(collection);
  const issues = [
    createRequestIssue({
      code: "empty-url",
      label: "Requests with empty URL",
      requests: requestContexts
        .filter((context) => !context.request.url.trim())
        .map((context) => context.request),
      severity: "error",
    }),
    createRequestIssue({
      code: "missing-variable",
      label: "Requests with missing or empty variables",
      requests: requestContexts
        .filter(hasMissingVariables)
        .map((context) => context.request),
      severity: "error",
    }),
    createRequestIssue({
      code: "duplicate-request",
      label: "Duplicate request groups",
      requests: duplicateGroups.flatMap((group) =>
        group.requests.map((match) => match.request),
      ),
      severity: "warning",
      count: duplicateGroups.length,
    }),
    createRequestIssue({
      code: "no-examples",
      label: "Requests without examples",
      requests: requestContexts
        .filter((context) => !context.request.examples?.length)
        .map((context) => context.request),
      severity: "warning",
    }),
    createRequestIssue({
      code: "no-tests",
      label: "Requests without tests",
      requests: requestContexts
        .filter(
          (context) =>
            !context.request.testScript?.trim() &&
            !context.inheritedTestScript.trim(),
        )
        .map((context) => context.request),
      severity: "warning",
    }),
    createRequestIssue({
      code: "no-docs",
      label: "Requests without docs",
      requests: requestContexts
        .filter((context) => !context.request.description?.trim())
        .map((context) => context.request),
      severity: "warning",
    }),
  ].filter((issue): issue is CollectionHealthIssue => Boolean(issue));

  return {
    documentedRequests: requestContexts.filter((context) =>
      context.request.description?.trim(),
    ).length,
    duplicateGroups: duplicateGroups.length,
    issues,
    requestsWithExamples: requestContexts.filter(
      (context) => context.request.examples?.length,
    ).length,
    requestsWithTests: requestContexts.filter(
      (context) =>
        context.request.testScript?.trim() ||
        context.inheritedTestScript.trim(),
    ).length,
    requestCount: requestContexts.length,
    score: calculateScore(requestContexts.length, issues),
  };
}

function flattenRequests(
  items: Array<Folder | SavedRequest>,
  inherited: {
    inheritedTestScript: string;
    variables: EnvironmentVariable[];
  },
): RequestContext[] {
  return items.flatMap((item) => {
    if (item.type === "request") {
      return [{ request: item, ...inherited }];
    }

    return flattenRequests(item.items, {
      inheritedTestScript:
        item.testScript || inherited.inheritedTestScript || "",
      variables: [...inherited.variables, ...(item.variables || [])],
    });
  });
}

function hasMissingVariables(context: RequestContext) {
  const variables = extractRequestVariables(context.request);
  return variables.some((name) => {
    if (name.startsWith("$chain:")) return false;
    if (resolveDynamicVariable(name) !== null) return false;
    const found = [...context.variables]
      .reverse()
      .find((variable) => variable.key === name && variable.enabled);
    return !found || found.value.length === 0;
  });
}

function createRequestIssue(input: {
  code: CollectionHealthIssue["code"];
  count?: number;
  label: string;
  requests: SavedRequest[];
  severity: CollectionHealthIssue["severity"];
}) {
  const count = input.count ?? input.requests.length;
  if (count === 0) return null;
  return { ...input, count };
}

function calculateScore(requestCount: number, issues: CollectionHealthIssue[]) {
  if (requestCount === 0) return 100;
  const maxChecks = Math.max(requestCount * 5, 1);
  const penalty = issues.reduce((total, issue) => total + issue.count, 0);
  return Math.max(0, Math.round(100 - (penalty / maxChecks) * 100));
}
