import { sendHttpRequest } from "../../../lib/httpRequestSender";
import { applyPathVariables } from "../../../utils/pathVariables";
import type {
  Collection,
  Environment,
  EnvironmentVariable,
  HttpResponse,
  TabData,
  TestResult,
} from "../core/types";
import {
  getRequestAncestors,
  interpolateVariables,
  resolveRequestAuth,
} from "./requestHelpers";
import {
  createScriptApi,
  createScriptConsole,
  createScriptResponse,
  runScripts,
} from "./scriptRuntime";
import { validateRequestUrl } from "./validateRequestUrl";

export interface WorkspaceRequestRunResult {
  collectionId?: string;
  consoleLogs: string[];
  response: HttpResponse;
  testResults: TestResult[];
}

export async function runWorkspaceRequest(args: {
  activeEnvironment: Environment | undefined;
  activeEnvironmentId: string | null;
  collectionId?: string;
  collectionVariablesDraft?: EnvironmentVariable[];
  collections: Collection[];
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  requestTab: TabData;
  responseCache: Record<string, HttpResponse>;
  secrets: Record<string, string>;
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  updateFolder: (collectionId: string, folderId: string, data: any) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
}) {
  const testResults: TestResult[] = [];
  const consoleLogs: string[] = [];
  const customConsole = createScriptConsole(consoleLogs);
  const collectionContext = findCollectionForTab(
    args.requestTab,
    args.collections,
    args.collectionId,
  );
  const collectionVariablesDraft = args.collectionVariablesDraft || [
    ...(collectionContext?.collection.variables || []),
  ];
  const requestDraft = {
    ...args.requestTab,
    headers: [...args.requestTab.headers],
  };
  const draftCollections = () =>
    buildCollectionsWithVariableDraft(
      args.collections,
      collectionContext?.collectionId,
      collectionVariablesDraft,
    );
  const ancestors = getRequestAncestors(requestDraft, draftCollections());
  const sy = createScriptApi({
    activeEnvironmentId: args.activeEnvironmentId,
    collectionVariablesDraft,
    environments: args.environments,
    globalVariables: args.globalVariables,
    ancestors,
    requestDraft,
    testResults,
    updateEnvironment: args.updateEnvironment,
    updateGlobalVariables: args.updateGlobalVariables,
    updateFolder: args.updateFolder,
  });

  const allPreScripts = [
    ...ancestors.map((ancestor) => ancestor.preRequestScript),
    args.requestTab.preRequestScript,
  ].filter((script) => script && script.trim());
  const allTestScripts = [
    ...ancestors.map((ancestor) => ancestor.testScript),
    args.requestTab.testScript,
  ].filter((script) => script && script.trim());

  runScripts(
    allPreScripts,
    sy,
    customConsole,
    consoleLogs,
    "PRE-SCRIPT ERROR",
    "Pre-request script failed:",
  );

  const response = await sendInterpolatedRequest({
    activeEnvironment: args.activeEnvironment,
    collections: draftCollections(),
    globalVariables: args.globalVariables,
    requestTab: requestDraft,
    responseCache: args.responseCache,
    secrets: args.secrets,
  });

  sy.response = createScriptResponse(response);
  runScripts(
    allTestScripts,
    sy,
    customConsole,
    consoleLogs,
    "POST-SCRIPT ERROR",
    "Post-response script failed:",
  );

  return {
    collectionId: collectionContext?.collectionId,
    consoleLogs,
    response,
    testResults,
  };
}

function buildCollectionsWithVariableDraft(
  collections: Collection[],
  collectionId: string | undefined,
  variables: EnvironmentVariable[],
) {
  if (!collectionId) return collections;
  return collections.map((collection) =>
    collection.id === collectionId ? { ...collection, variables } : collection,
  );
}

async function sendInterpolatedRequest(args: {
  activeEnvironment: Environment | undefined;
  collections: Collection[];
  globalVariables: EnvironmentVariable[];
  requestTab: TabData;
  responseCache: Record<string, HttpResponse>;
  secrets: Record<string, string>;
}) {
  const interpolate = (text: string) =>
    interpolateVariables({
      activeEnvironment: args.activeEnvironment,
      activeTab: args.requestTab,
      collections: args.collections,
      globalVariables: args.globalVariables,
      responseCache: args.responseCache,
      secrets: args.secrets,
      text,
    });
  const headerMap: Record<string, string> = {};
  args.requestTab.headers.forEach((header) => {
    if (header.enabled === false || !header.key || !header.value) return;
    headerMap[interpolate(header.key)] = interpolate(header.value);
  });

  const { authType: finalAuthType, bearerToken: finalBearerToken } =
    resolveRequestAuth(args.requestTab, args.collections);
  if (finalAuthType === "bearer" && finalBearerToken) {
    headerMap.Authorization = `Bearer ${interpolate(finalBearerToken)}`;
  }

  const pathVariables = args.requestTab.pathVariables?.map((variable) => ({
    ...variable,
    value: interpolate(variable.value),
  }));
  const requestUrl = applyPathVariables(
    interpolate(args.requestTab.url),
    pathVariables,
  );
  const urlError = validateRequestUrl(requestUrl);
  if (urlError) throw new Error(urlError);

  return sendHttpRequest({
    url: requestUrl,
    method: args.requestTab.method,
    headers: headerMap,
    body: buildRequestBody(args.requestTab, interpolate),
  });
}

function buildRequestBody(
  requestTab: TabData,
  interpolate: (text: string) => string,
) {
  const currentBodyType = requestTab.bodyType || "raw";
  if (currentBodyType === "raw") {
    const body = requestTab.body.trim() === "" ? null : requestTab.body;
    return body
      ? { type: "Raw" as const, content: interpolate(body) }
      : { type: "None" as const };
  }

  if (
    currentBodyType !== "form-data" &&
    currentBodyType !== "x-www-form-urlencoded"
  ) {
    return { type: "None" as const };
  }

  const items = (requestTab.formData || [])
    .filter((item) => item.enabled && item.key)
    .map((item) => ({
      key: interpolate(item.key),
      value: item.type === "file" ? "" : interpolate(item.value),
      type: item.type,
      files: item.files,
    }));

  if (items.length === 0) return { type: "None" as const };
  return {
    type:
      currentBodyType === "form-data"
        ? ("FormData" as const)
        : ("FormUrlEncoded" as const),
    items,
  };
}

function findCollectionForTab(
  tab: TabData,
  collections: Collection[],
  fallbackCollectionId?: string,
) {
  const collectionId = tab.collectionId || fallbackCollectionId;
  if (collectionId) {
    const collection = collections.find((item) => item.id === collectionId);
    if (collection) return { collectionId: collection.id, collection };
  }
  return null;
}
