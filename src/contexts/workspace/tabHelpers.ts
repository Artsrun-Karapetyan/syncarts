import type { Collection, Folder, SavedRequest, SavedRequestLocation, TabData } from './types';

export function findSavedRequestByIdInCollections(
  collections: Collection[],
  requestId?: string
): SavedRequestLocation | null {
  if (!requestId) return null;

  for (const collection of collections) {
    const walk = (items: (Folder | SavedRequest)[], parentFolderId: string | null): SavedRequestLocation | null => {
      for (const item of items) {
        if (item.type === 'request' && item.id === requestId) {
          return { collectionId: collection.id, folderId: parentFolderId, request: item };
        }
        if (item.type === 'folder') {
          const found = walk(item.items, item.id);
          if (found) return found;
        }
      }
      return null;
    };

    const found = walk(collection.items, null);
    if (found) return found;
  }

  return null;
}

export const requestSnapshot = (request: Partial<TabData | SavedRequest>) => JSON.stringify({
  name: request.name || '',
  method: request.method || 'GET',
  url: request.url || '',
  headers: request.headers || [],
  authType: request.authType || 'inherit',
  bearerToken: request.bearerToken || '',
  bodyType: request.bodyType || 'raw',
  pathVariables: request.pathVariables || [],
  queryParamDescriptions: request.queryParamDescriptions || {},
  queryParams: request.queryParams || [],
  formData: request.formData || [],
  body: request.body || '',
  description: request.description || '',
  preRequestScript: request.preRequestScript || '',
  testScript: request.testScript || '',
});

export const buildSavedRequestFromTab = (tab: TabData, id: string, existing?: SavedRequest): SavedRequest => ({
  type: 'request',
  id,
  name: tab.name || 'Untitled Request',
  method: tab.method || 'GET',
  url: tab.url || '',
  headers: tab.headers || [],
  authType: tab.authType,
  bearerToken: tab.bearerToken,
  bodyType: tab.bodyType,
  pathVariables: tab.pathVariables,
  queryParamDescriptions: tab.queryParamDescriptions,
  queryParams: tab.queryParams,
  formData: tab.formData,
  description: tab.description,
  preRequestScript: tab.preRequestScript,
  testScript: tab.testScript,
  body: tab.body || '',
  examples: existing?.examples,
});
