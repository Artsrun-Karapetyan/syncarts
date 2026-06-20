import type {
  Environment,
  EnvironmentVariable,
  TabData,
} from "@/contexts/workspace/core/types";
import { createScriptResponseBody } from "@/contexts/workspace/requests/scriptRuntimeResponse";

export function createRequestHeadersApi(requestDraft: TabData) {
  return {
    add: (header: { key: string; value: string } | string, value?: string) => {
      const next =
        typeof header === "string"
          ? { key: header, value: value || "" }
          : header;
      requestDraft.headers = [...requestDraft.headers, next];
    },
    upsert: (
      header: { key: string; value: string } | string,
      value?: string,
    ) => {
      const next =
        typeof header === "string"
          ? { key: header, value: value || "" }
          : header;
      const index = requestDraft.headers.findIndex(
        (h) => h.key.toLowerCase() === next.key.toLowerCase(),
      );
      requestDraft.headers =
        index === -1
          ? [...requestDraft.headers, next]
          : requestDraft.headers.map((h, i) => (i === index ? next : h));
    },
    remove: (key: string) => {
      requestDraft.headers = requestDraft.headers.filter(
        (h) => h.key.toLowerCase() !== key.toLowerCase(),
      );
    },
    get: (key: string) =>
      requestDraft.headers.find(
        (h) => h.key.toLowerCase() === key.toLowerCase(),
      )?.value,
    has: (key: string) =>
      requestDraft.headers.some(
        (h) => h.key.toLowerCase() === key.toLowerCase(),
      ),
    all: () => requestDraft.headers,
  };
}

export function createVariablesApi(args: {
  activeEnvironmentId: string | null;
  ancestors: any[];
  collectionVariablesDraft: EnvironmentVariable[];
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
}) {
  const {
    activeEnvironmentId,
    ancestors,
    collectionVariablesDraft,
    environments,
    globalVariables,
    updateEnvironment,
    updateGlobalVariables,
  } = args;

  return {
    get: (key: string) => {
      let val =
        activeEnvironmentId && activeEnvironmentId !== "none"
          ? environments
              .find((e) => e.id === activeEnvironmentId)
              ?.variables.find((v) => v.key === key && v.enabled)?.value
          : undefined;

      if (val === undefined && ancestors && ancestors.length > 0) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const ancestorVar = ancestors[i].variables?.find(
            (v: any) => v.key === key && v.enabled,
          );
          if (ancestorVar) {
            val = ancestorVar.value;
            break;
          }
        }
      }

      return (
        val ??
        collectionVariablesDraft.find((v) => v.key === key && v.enabled)
          ?.value ??
        globalVariables.find((v) => v.key === key && v.enabled)?.value
      );
    },
    set: (key: string, value: string) => {
      if (activeEnvironmentId && activeEnvironmentId !== "none") {
        const env = environments.find((e) => e.id === activeEnvironmentId);
        if (env) {
          updateEnvironment(env.id, {
            variables: upsertVariable(env.variables, key, value),
          });
          return;
        }
      }
      updateGlobalVariables(upsertVariable(globalVariables, key, value));
    },
    unset: (key: string) => {
      if (activeEnvironmentId && activeEnvironmentId !== "none") {
        const env = environments.find((e) => e.id === activeEnvironmentId);
        if (env) {
          updateEnvironment(env.id, {
            variables: env.variables.filter((v) => v.key !== key),
          });
          return;
        }
      }
      updateGlobalVariables(globalVariables.filter((v) => v.key !== key));
    },
  };
}

export function upsertVariable(
  variables: EnvironmentVariable[],
  key: string,
  value: string,
) {
  const existingIndex = variables.findIndex((v) => v.key === key);
  const newVars = [...variables];
  if (existingIndex >= 0) {
    newVars[existingIndex] = {
      ...newVars[existingIndex],
      value,
      enabled: true,
    };
  } else {
    newVars.push({ id: crypto.randomUUID(), key, value, enabled: true });
  }
  return newVars;
}

export function replaceDraftVariables(
  target: EnvironmentVariable[],
  next: EnvironmentVariable[],
) {
  target.splice(0, target.length, ...next);
}

export async function sendRequest(
  request:
    | string
    | {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: BodyInit | null;
      },
  callback?: (
    err: unknown,
    response?: ReturnType<typeof createFetchScriptResponse>,
  ) => void,
) {
  try {
    const url = typeof request === "string" ? request : request.url;
    const init =
      typeof request === "string"
        ? undefined
        : {
            method: request.method,
            headers: request.headers,
            body: request.body,
          };
    const response = await fetch(url, init);
    const body = await response.text();
    const scriptResponse = createFetchScriptResponse(response, body);
    callback?.(null, scriptResponse);
    return scriptResponse;
  } catch (err) {
    callback?.(err);
    throw err;
  }
}

function createFetchScriptResponse(response: Response, body: string) {
  return createScriptResponseBody({
    body,
    headers: Object.fromEntries(response.headers.entries()),
    responseTime: 0,
    status: response.status,
    statusText: response.statusText,
  });
}
