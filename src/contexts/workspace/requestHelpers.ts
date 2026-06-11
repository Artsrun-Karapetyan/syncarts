import { resolveDynamicVariable } from '../../components/request/variableResolution';
import type { Collection, Environment, EnvironmentVariable, Folder, SavedRequest, TabData } from './types';

export function getRequestAncestors(activeTab: TabData | undefined, collections: Collection[]): (Collection | Folder)[] {
  if (!activeTab || !activeTab.collectionId) return [];
  const col = collections.find(c => c.id === activeTab.collectionId);
  if (!col) return [];

  const ancestors: (Collection | Folder)[] = [col];
  if (activeTab.folderId) {
    const folderPath = getFolderPath(col.items, activeTab.folderId);
    if (folderPath) ancestors.push(...folderPath);
  }
  return ancestors;
}

export function resolveRequestAuth(activeTab: TabData | undefined, collections: Collection[]) {
  let authType = activeTab?.authType || 'inherit';
  let bearerToken = activeTab?.bearerToken || '';
  let inheritedFrom: Collection | Folder | null = null;

  if (authType === 'inherit' && activeTab) {
    const ancestors = getRequestAncestors(activeTab, collections);
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      if (ancestor.authType && ancestor.authType !== 'inherit') {
        authType = ancestor.authType;
        bearerToken = ancestor.bearerToken || '';
        inheritedFrom = ancestor;
        break;
      }
    }
  }

  return { authType, bearerToken, inheritedFrom };
}

export function interpolateVariables(args: {
  activeEnvironment: Environment | undefined;
  activeTab: TabData | undefined;
  collections: Collection[];
  globalVariables: EnvironmentVariable[];
  text: string;
}) {
  const { activeEnvironment, activeTab, collections, globalVariables, text } = args;
  if (!text) return text;

  let result = text;
  const activeVars = activeEnvironment ? activeEnvironment.variables.filter(v => v.enabled && v.key) : [];
  for (const v of activeVars) {
    result = result.split(`{{${v.key}}}`).join(v.value);
  }

  const ancestors = getRequestAncestors(activeTab, collections);
  
  const matches = result.match(/\{\{([^}]+)\}\}/g);
  if (matches) {
    for (const match of matches) {
      const key = match.slice(2, -2);
      const dynamicValue = resolveDynamicVariable(key);
      if (dynamicValue !== null) {
        result = result.split(match).join(dynamicValue);
        continue;
      }

      let foundInAncestor = false;
      for (let i = ancestors.length - 1; i >= 0; i--) {
        const ancestorVar = ancestors[i].variables?.find((v: any) => v.key === key && v.enabled);
        if (ancestorVar) {
          result = result.split(match).join(ancestorVar.value);
          foundInAncestor = true;
          break;
        }
      }
      if (foundInAncestor) continue;

      const globalVar = globalVariables.find(v => v.key === key && v.enabled);
      if (globalVar) result = result.split(match).join(globalVar.value);
    }
  }

  return result;
}


function getFolderPath(items: (Folder | SavedRequest)[], targetId: string): Folder[] | null {
  for (const item of items) {
    if (item.type === 'folder') {
      if (item.id === targetId) return [item];
      const subPath = getFolderPath(item.items, targetId);
      if (subPath) return [item, ...subPath];
    }
  }
  return null;
}
