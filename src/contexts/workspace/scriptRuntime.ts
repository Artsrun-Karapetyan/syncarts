import type {
  Environment,
  EnvironmentVariable,
  HttpResponse,
  TabData,
  TestResult,
} from "./types";

export function createScriptConsole(consoleLogs: string[]) {
  return {
    log: (...args: any[]) => {
      consoleLogs.push(
        args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" "),
      );
      console.log(...args);
    },
    error: (...args: any[]) => {
      consoleLogs.push(
        `[ERROR] ${args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" ")}`,
      );
      console.error(...args);
    },
    warn: (...args: any[]) => {
      consoleLogs.push(
        `[WARN] ${args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" ")}`,
      );
      console.warn(...args);
    },
  };
}

export function createScriptApi(args: {
  activeEnvironmentId: string | null;
  collectionVariablesDraft: EnvironmentVariable[];
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  ancestors: any[];
  requestDraft: TabData;
  testResults: TestResult[];
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
}) {
  const {
    activeEnvironmentId,
    collectionVariablesDraft,
    environments,
    globalVariables,
    ancestors,
    requestDraft,
    testResults,
    updateEnvironment,
    updateGlobalVariables,
  } = args;
  const requestHeaders = createRequestHeadersApi(requestDraft);
  const api = {
    request: {
      addHeader: requestHeaders.add,
      getHeaders: requestHeaders.all,
      headers: requestHeaders,
      method: requestDraft.method,
      removeHeader: requestHeaders.remove,
      url: requestDraft.url,
    },
    environment: {
      set: (key: string, value: string) => {
        if (!activeEnvironmentId || activeEnvironmentId === "none") return;
        const env = environments.find((e) => e.id === activeEnvironmentId);
        if (env)
          updateEnvironment(env.id, {
            variables: upsertVariable(env.variables, key, value),
          });
      },
      get: (key: string) => {
        if (!activeEnvironmentId || activeEnvironmentId === "none")
          return undefined;
        return environments
          .find((e) => e.id === activeEnvironmentId)
          ?.variables.find((v) => v.key === key)?.value;
      },
      unset: (key: string) => {
        if (!activeEnvironmentId || activeEnvironmentId === "none") return;
        const env = environments.find((e) => e.id === activeEnvironmentId);
        if (env)
          updateEnvironment(env.id, {
            variables: env.variables.filter((v) => v.key !== key),
          });
      },
    },
    collectionVariables: {
      set: (key: string, value: string) => {
        replaceDraftVariables(
          collectionVariablesDraft,
          upsertVariable(collectionVariablesDraft, key, value),
        );
      },
      get: (key: string) =>
        collectionVariablesDraft.find((v) => v.key === key)?.value,
      unset: (key: string) => {
        replaceDraftVariables(
          collectionVariablesDraft,
          collectionVariablesDraft.filter((v) => v.key !== key),
        );
      },
    },
    globals: {
      set: (key: string, value: string) =>
        updateGlobalVariables(upsertVariable(globalVariables, key, value)),
      get: (key: string) => globalVariables.find((v) => v.key === key)?.value,
      unset: (key: string) =>
        updateGlobalVariables(globalVariables.filter((v) => v.key !== key)),
    },
    variables: createVariablesApi(
      activeEnvironmentId,
      collectionVariablesDraft,
      environments,
      globalVariables,
      ancestors,
      updateEnvironment,
      updateGlobalVariables,
    ),
    sendRequest,
    response: null as any,
    test: (name: string, fn: () => void) => {
      try {
        fn();
        testResults.push({ name, passed: true });
      } catch (e: any) {
        testResults.push({
          name,
          passed: false,
          error: e.message || String(e),
        });
      }
    },
    expect: (val: any) => ({
      to: {
        eql: (expected: any) => {
          if (val !== expected)
            throw new Error(`Expected ${val} to equal ${expected}`);
        },
        be: {
          below: (expected: number) => {
            if (val >= expected)
              throw new Error(`Expected ${val} to be below ${expected}`);
          },
          oneOf: (expectedList: any[]) => {
            if (!expectedList.includes(val))
              throw new Error(`Expected ${val} to be one of ${expectedList}`);
          },
        },
        include: (expected: any) => {
          if (typeof val === "string" && !val.includes(expected))
            throw new Error(`Expected ${val} to include ${expected}`);
        },
      },
    }),
  };
  return api;
}

export function createScriptResponse(result: HttpResponse) {
  const headers = createHeadersReader(result.headers || {});
  return {
    json: () => JSON.parse(result.body),
    text: () => result.body,
    responseTime: result.time_ms,
    code: result.status,
    status: result.status_text,
    headers,
    to: {
      have: {
        status: (code: number | string) => {
          if (typeof code === "number" && result.status !== code)
            throw new Error(`Expected status ${code} but got ${result.status}`);
          if (
            typeof code === "string" &&
            result.status !== 200 &&
            result.status !== 201
          )
            throw new Error(`Expected status to match ${code}`);
        },
        body: (text: string) => {
          if (result.body !== text)
            throw new Error(`Expected body to be ${text}`);
        },
        header: (key: string) => {
          if (!headers.has(key)) throw new Error(`Header ${key} not found`);
        },
      },
    },
  };
}

export function runScripts(
  scripts: (string | undefined)[],
  sy: any,
  customConsole: ReturnType<typeof createScriptConsole>,
  consoleLogs: string[],
  logPrefix: string,
  consolePrefix: string,
) {
  for (const script of scripts) {
    try {
      const fn = new Function("sy", "pm", "console", script!);
      fn(sy, sy, customConsole);
    } catch (e: any) {
      consoleLogs.push(`[${logPrefix}] ${e.message || String(e)}`);
      console.error(consolePrefix, e);
    }
  }
}

function createRequestHeadersApi(requestDraft: TabData) {
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

function createVariablesApi(
  activeEnvironmentId: string | null,
  collectionVariablesDraft: EnvironmentVariable[],
  environments: Environment[],
  globalVariables: EnvironmentVariable[],
  ancestors: any[],
  updateEnvironment: (id: string, data: Partial<Environment>) => void,
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void,
) {
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

function upsertVariable(
  variables: EnvironmentVariable[],
  key: string,
  value: string,
) {
  const existingIndex = variables.findIndex((v) => v.key === key);
  const newVars = [...variables];
  if (existingIndex >= 0)
    newVars[existingIndex] = {
      ...newVars[existingIndex],
      value,
      enabled: true,
    };
  else newVars.push({ id: crypto.randomUUID(), key, value, enabled: true });
  return newVars;
}

function replaceDraftVariables(
  target: EnvironmentVariable[],
  next: EnvironmentVariable[],
) {
  target.splice(0, target.length, ...next);
}

async function sendRequest(
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
  const headers = createHeadersReader(
    Object.fromEntries(response.headers.entries()),
  );
  return {
    json: () => JSON.parse(body),
    text: () => body,
    responseTime: 0,
    code: response.status,
    status: response.statusText,
    headers,
    to: {
      have: {
        status: (code: number | string) => {
          if (typeof code === "number" && response.status !== code)
            throw new Error(
              `Expected status ${code} but got ${response.status}`,
            );
          if (typeof code === "string" && response.statusText !== code)
            throw new Error(`Expected status to match ${code}`);
        },
        body: (text: string) => {
          if (body !== text) throw new Error(`Expected body to be ${text}`);
        },
        header: (key: string) => {
          if (!headers.has(key)) throw new Error(`Header ${key} not found`);
        },
      },
    },
  };
}

function createHeadersReader(headers: Record<string, string>) {
  return {
    all: () => headers,
    get: (key: string) => {
      const found = Object.entries(headers).find(
        ([headerKey]) => headerKey.toLowerCase() === key.toLowerCase(),
      );
      return found?.[1];
    },
    has: (key: string) =>
      Object.keys(headers).some(
        (headerKey) => headerKey.toLowerCase() === key.toLowerCase(),
      ),
  };
}
