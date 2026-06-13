import type {
  Environment,
  EnvironmentVariable,
  HttpResponse,
  TabData,
  TestResult,
} from "../core/types";
import {
  createRequestHeadersApi,
  createVariablesApi,
  replaceDraftVariables,
  sendRequest,
  upsertVariable,
} from "./scriptRuntimeApis";
import { createScriptResponseBody } from "./scriptRuntimeResponse";

export function createScriptConsole(consoleLogs: string[]) {
  return {
    log: (...args: any[]) => {
      consoleLogs.push(
        args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" "),
      );
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
    variables: createVariablesApi({
      activeEnvironmentId,
      ancestors,
      collectionVariablesDraft,
      environments,
      globalVariables,
      updateEnvironment,
      updateGlobalVariables,
    }),
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
  return createScriptResponseBody({
    body: result.body,
    headers: result.headers || {},
    responseTime: result.time_ms,
    status: result.status,
    stringStatusMode: "okCreated",
    statusText: result.status_text,
  });
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
