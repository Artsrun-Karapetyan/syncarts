import { invoke } from '@tauri-apps/api/core';
import useSWRMutation from 'swr/mutation';
import { getRequestAncestors, interpolateVariables, resolveRequestAuth } from './requestHelpers';
import { createScriptApi, createScriptConsole, createScriptResponse, runScripts } from './scriptRuntime';
import type { Collection, Environment, EnvironmentVariable, Folder, HttpResponse, SavedRequest, TabData, TestResult } from './types';
import { applyPathVariables } from '../../utils/pathVariables';

interface RequestSenderArgs {
  activeEnvironment: Environment | undefined;
  activeEnvironmentId: string | null;
  activeTab: TabData | undefined;
  collections: Collection[];
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  updateActiveTab: (data: Partial<TabData>) => void;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
}

export function useRequestSender(args: RequestSenderArgs) {
  const {
    activeEnvironment,
    activeEnvironmentId,
    activeTab,
    collections,
    environments,
    globalVariables,
    updateActiveTab,
    updateCollection,
    updateEnvironment,
    updateGlobalVariables
  } = args;

  const { trigger, isMutating, error } = useSWRMutation(
    'api-request',
    async (_key: string, { arg }: { arg: { requestTab: TabData; collections: Collection[] } }) => {
    const requestTab = arg?.requestTab || activeTab;
    if (!requestTab) return null;
    const requestCollections = arg?.collections || collections;
    const interpolate = (text: string) => interpolateVariables({
      activeEnvironment,
      activeTab: requestTab,
      collections: requestCollections,
      globalVariables,
      text
    });
    const headerMap: Record<string, string> = {};
    requestTab.headers.forEach((h) => {
      if (h.key && h.value) headerMap[interpolate(h.key)] = interpolate(h.value);
    });

    const { authType: finalAuthType, bearerToken: finalBearerToken } = resolveRequestAuth(requestTab, requestCollections);

    if (finalAuthType === 'bearer' && finalBearerToken) {
      headerMap.Authorization = `Bearer ${interpolate(finalBearerToken)}`;
    }

    let reqBodyPayload: any = { type: 'None' };
    const currentBodyType = requestTab.bodyType || 'raw';
    if (currentBodyType === 'raw') {
      let bodyStr = requestTab.body.trim() === '' ? null : requestTab.body;
      if (bodyStr) bodyStr = interpolate(bodyStr);
      if (bodyStr) reqBodyPayload = { type: 'Raw', content: bodyStr };
    } else if (currentBodyType === 'form-data' || currentBodyType === 'x-www-form-urlencoded') {
      const formData = requestTab.formData || [];
      const items = formData.filter(item => item.enabled && item.key).map(item => ({
        key: interpolate(item.key),
        value: item.type === 'file' ? '' : interpolate(item.value),
        type: item.type,
        files: item.files,
      }));

      if (items.length > 0) {
        reqBodyPayload = { type: currentBodyType === 'form-data' ? 'FormData' : 'FormUrlEncoded', items };
      }
    }

    const pathVariables = requestTab.pathVariables?.map((variable) => ({
      ...variable,
      value: interpolate(variable.value)
    }));
    const requestUrl = applyPathVariables(interpolate(requestTab.url), pathVariables);
    const res: HttpResponse = await invoke('make_request', {
      request: { url: requestUrl, method: requestTab.method, headers: headerMap, body: reqBodyPayload }
    });
    return res;
  });

  const sendRequest = async () => {
    if (!activeTab) return;
    try {
      updateActiveTab({ response: null });
      const testResults: TestResult[] = [];
      const consoleLogs: string[] = [];
      const customConsole = createScriptConsole(consoleLogs);
      const collectionContext = findCollectionForTab(activeTab, collections);
      const col = collectionContext?.collection || null;
      const collectionVariablesDraft = [...(col?.variables || [])];
      const requestDraft = { ...activeTab, headers: [...activeTab.headers] };
      const draftCollections = () => buildCollectionsWithVariableDraft(collections, collectionContext?.collectionId, collectionVariablesDraft);
      const ancestors = getRequestAncestors(activeTab, draftCollections());

      const sy = createScriptApi({
        activeEnvironmentId,
        collectionVariablesDraft,
        environments,
        globalVariables,
        ancestors,
        requestDraft,
        testResults,
        updateEnvironment,
        updateGlobalVariables
      });

      const allPreScripts = [...ancestors.map(a => a.preRequestScript), activeTab.preRequestScript].filter(s => s && s.trim());
      const allTestScripts = [...ancestors.map(a => a.testScript), activeTab.testScript].filter(s => s && s.trim());
      runScripts(allPreScripts, sy, customConsole, consoleLogs, 'PRE-SCRIPT ERROR', 'Pre-request script failed:');

      const result = await trigger({ requestTab: requestDraft, collections: draftCollections() });
      if (!result) return;

      sy.response = createScriptResponse(result);
      runScripts(allTestScripts, sy, customConsole, consoleLogs, 'POST-SCRIPT ERROR', 'Post-response script failed:');
      if (collectionContext) {
        updateCollection(collectionContext.collectionId, { variables: collectionVariablesDraft });
      }
      updateActiveTab({ response: result, testResults, consoleLogs });
    } catch (err) {
      console.error(err);
    }
  };

  return { sendRequest, isMutating, error };
}

function buildCollectionsWithVariableDraft(
  collections: Collection[],
  collectionId: string | undefined,
  variables: EnvironmentVariable[]
) {
  if (!collectionId) return collections;
  return collections.map(collection =>
    collection.id === collectionId ? { ...collection, variables } : collection
  );
}

function findCollectionForTab(tab: TabData, collections: Collection[]) {
  if (tab.collectionId) {
    const collection = collections.find(c => c.id === tab.collectionId);
    if (collection) return { collectionId: collection.id, collection };
  }

  const requestId = tab.savedRequestId || tab.id;
  for (const collection of collections) {
    if (hasRequest(collection.items, requestId)) return { collectionId: collection.id, collection };
  }
  return null;
}

function hasRequest(items: (Folder | SavedRequest)[], requestId: string): boolean {
  for (const item of items) {
    if (item.type === 'request' && item.id === requestId) return true;
    if (item.type === 'folder' && hasRequest(item.items, requestId)) return true;
  }
  return false;
}
