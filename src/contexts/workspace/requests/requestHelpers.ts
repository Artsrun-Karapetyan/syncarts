import { resolveDynamicVariable } from "../../../components/request/variables/variableResolution";
import type {
  Collection,
  Environment,
  EnvironmentVariable,
  Folder,
  SavedRequest,
  TabData,
} from "../core/types";

export function getRequestAncestors(
  activeTab: TabData | undefined,
  collections: Collection[],
): (Collection | Folder)[] {
  if (!activeTab || !activeTab.collectionId) return [];
  const col = collections.find((c) => c.id === activeTab.collectionId);
  if (!col) return [];

  const ancestors: (Collection | Folder)[] = [col];
  if (activeTab.folderId) {
    const folderPath = getFolderPath(col.items, activeTab.folderId);
    if (folderPath) ancestors.push(...folderPath);
  }
  return ancestors;
}

export function resolveRequestAuth(
  activeTab: TabData | undefined,
  collections: Collection[],
) {
  let authType = activeTab?.authType || "inherit";
  let bearerToken = activeTab?.bearerToken || "";
  let inheritedFrom: Collection | Folder | null = null;

  if (authType === "inherit" && activeTab) {
    const ancestors = getRequestAncestors(activeTab, collections);
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      if (ancestor.authType && ancestor.authType !== "inherit") {
        authType = ancestor.authType;
        bearerToken = ancestor.bearerToken || "";
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
  const { activeEnvironment, activeTab, collections, globalVariables, text } =
    args;
  if (!text) return text;

  const ancestors = getRequestAncestors(activeTab, collections);

  const lookupQueue: { source: string; vars: EnvironmentVariable[] }[] = [];

  if (activeEnvironment) {
    lookupQueue.push({ source: "env", vars: activeEnvironment.variables });
  }

  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (ancestors[i].variables) {
      lookupQueue.push({
        source: `ancestor_${i}`,
        vars: ancestors[i].variables!,
      });
    }
  }

  if (globalVariables) {
    lookupQueue.push({ source: "global", vars: globalVariables });
  }

  function resolveKey(
    key: string,
    skipSources: Set<string> = new Set(),
  ): string | null {
    const dynamicValue = resolveDynamicVariable(key);
    if (dynamicValue !== null) return dynamicValue;

    for (const scope of lookupQueue) {
      if (skipSources.has(scope.source)) continue;

      const v = scope.vars.find((v) => v.key === key && v.enabled);
      if (v) {
        const nextSkip = new Set(skipSources);
        nextSkip.add(scope.source);
        return interpolateString(v.value, nextSkip);
      }
    }
    return null;
  }

  function interpolateString(str: string, skipSources: Set<string>): string {
    if (!str) return str;
    let result = str;
    let iterations = 0;
    let previousResult = "";

    while (result !== previousResult && iterations < 5) {
      previousResult = result;
      const matches = result.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        for (const match of matches) {
          const key = match.slice(2, -2);
          const resolved = resolveKey(key, skipSources);
          if (resolved !== null) {
            result = result.split(match).join(resolved);
          }
        }
      }
      iterations++;
    }
    return result;
  }

  return interpolateString(text, new Set());
}

function getFolderPath(
  items: (Folder | SavedRequest)[],
  targetId: string,
): Folder[] | null {
  for (const item of items) {
    if (item.type === "folder") {
      if (item.id === targetId) return [item];
      const subPath = getFolderPath(item.items, targetId);
      if (subPath) return [item, ...subPath];
    }
  }
  return null;
}
