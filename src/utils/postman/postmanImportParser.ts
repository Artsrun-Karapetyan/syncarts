import type {
  BodyType,
  Collection,
  EnvironmentVariable,
  Folder,
  HeaderItem,
  SavedExample,
  SavedRequest,
} from "../../contexts/WorkspaceContext";
import { parsePostmanPathVariables } from "../postmanPathVariables";

export function parsePostmanCollection(
  jsonString: string,
): Omit<Collection, "id"> {
  const data = JSON.parse(jsonString);
  if (!data.info || !data.info.name) {
    throw new Error("Invalid Postman Collection format");
  }

  const parsedItems = Array.isArray(data.item) ? data.item.map(parseItem) : [];
  const { preRequestScript, testScript } = parseEvents(data.event);
  const { authType, bearerToken } = parseAuth(data.auth);
  const description =
    typeof data.info.description === "string" ? data.info.description : "";

  return {
    name: data.info.name,
    items: parsedItems,
    preRequestScript,
    testScript,
    authType,
    bearerToken,
    description,
    variables: parseVariables(data.variable),
  };
}

function parseItem(item: any): Folder | SavedRequest {
  const { preRequestScript, testScript } = parseEvents(item.event);
  const { authType, bearerToken } = parseAuth(item.auth);
  const description =
    typeof item.description === "string"
      ? item.description
      : item.request?.description || "";

  if (item.item) {
    return {
      type: "folder",
      id: crypto.randomUUID(),
      name: item.name || "Untitled Folder",
      items: item.item.map(parseItem),
      preRequestScript,
      testScript,
      authType,
      bearerToken,
      description,
      variables: parseFolderVariables(item.variable),
    };
  }

  return parseRequestItem({
    authType,
    bearerToken,
    description,
    item,
    preRequestScript,
    testScript,
  });
}

function parseRequestItem(args: {
  authType: "inherit" | "none" | "bearer";
  bearerToken: string;
  description: string;
  item: any;
  preRequestScript: string;
  testScript: string;
}): SavedRequest {
  const {
    authType,
    bearerToken,
    description,
    item,
    preRequestScript,
    testScript,
  } = args;
  const req = item.request || {};

  if (typeof req === "string") {
    return {
      type: "request",
      id: crypto.randomUUID(),
      name: item.name || "Untitled Request",
      method: "GET",
      url: req,
      pathVariables: parsePostmanPathVariables(undefined, req),
      headers: [{ key: "", value: "", enabled: true }],
      body: "",
      preRequestScript,
      testScript,
      authType,
      bearerToken,
      description,
    };
  }

  const url = getRequestUrl(req);
  const parsedMainBody = parseBody(req.body);
  const examples = parseExamples(item.response);

  return {
    type: "request",
    id: crypto.randomUUID(),
    name: item.name || "Untitled Request",
    method: req.method || "GET",
    url,
    pathVariables: parsePostmanPathVariables(req.url, url),
    headers: parseHeaders(req.header),
    body: parsedMainBody.body,
    bodyType: parsedMainBody.bodyType,
    formData: parsedMainBody.formData,
    preRequestScript,
    testScript,
    authType,
    bearerToken,
    description,
    queryParams: parseQueryParams(req.url),
    examples: examples.length > 0 ? examples : undefined,
  };
}

function parseEvents(events?: any[]) {
  let preRequestScript = "";
  let testScript = "";
  if (Array.isArray(events)) {
    events.forEach((event) => {
      if (
        event.listen === "prerequest" &&
        event.script &&
        Array.isArray(event.script.exec)
      ) {
        preRequestScript = event.script.exec.join("\n");
      } else if (
        event.listen === "test" &&
        event.script &&
        Array.isArray(event.script.exec)
      ) {
        testScript = event.script.exec.join("\n");
      }
    });
  }
  return { preRequestScript, testScript };
}

function parseAuth(auth?: any): {
  authType: "inherit" | "none" | "bearer";
  bearerToken: string;
} {
  let authType: "inherit" | "none" | "bearer" = "inherit";
  let bearerToken = "";
  if (auth) {
    if (auth.type === "noauth") authType = "none";
    if (auth.type === "bearer") {
      authType = "bearer";
      if (Array.isArray(auth.bearer)) {
        const tokenObj = auth.bearer.find((b: any) => b.key === "token");
        if (tokenObj) bearerToken = tokenObj.value;
      }
    }
  }
  return { authType, bearerToken };
}

function parseFolderVariables(variable?: any[]) {
  if (!Array.isArray(variable) || variable.length === 0) return undefined;
  return variable.map((item: any) => ({
    id: crypto.randomUUID(),
    key: item.key || "",
    value: item.value || "",
    enabled: item.disabled !== true,
  }));
}

function parseVariables(variable?: any[]) {
  const variables: EnvironmentVariable[] = [];
  if (Array.isArray(variable)) {
    variable.forEach((item: any) => {
      if (item.key) {
        variables.push({
          id: crypto.randomUUID(),
          key: item.key,
          value: item.value || "",
          enabled: item.disabled !== true,
        });
      }
    });
  }
  return variables;
}

function getRequestUrl(req: any) {
  if (typeof req.url === "string") return req.url;
  if (req.url && req.url.raw) return req.url.raw;
  return "";
}

function parseQueryParams(url: any) {
  if (!url || !Array.isArray(url.query) || url.query.length === 0) {
    return undefined;
  }
  return url.query.map((query: any) => ({
    key: query.key || "",
    value: query.value || "",
    description: typeof query.description === "string" ? query.description : "",
    enabled: query.disabled !== true,
  }));
}

function parseHeaders(header: any) {
  let headers: HeaderItem[] = [{ key: "", value: "", enabled: true }];
  if (Array.isArray(header) && header.length > 0) {
    headers = header.map((item: any) => ({
      key: item.key || "",
      value: item.value || "",
      description: typeof item.description === "string" ? item.description : "",
      enabled: item.disabled !== true,
    }));
    if (
      headers[headers.length - 1].key !== "" ||
      headers[headers.length - 1].value !== ""
    ) {
      headers.push({ key: "", value: "", enabled: true });
    }
  }
  return headers;
}

function parseBody(postmanBody: any) {
  let body = "";
  let bodyType: BodyType | undefined = undefined;
  let formData: any[] = [];

  if (postmanBody) {
    if (postmanBody.mode === "raw") {
      bodyType = "raw";
      body = postmanBody.raw || "";
    } else if (postmanBody.mode === "formdata") {
      bodyType = "form-data";
      formData = parseFormItems(postmanBody.formdata, true);
    } else if (postmanBody.mode === "urlencoded") {
      bodyType = "x-www-form-urlencoded";
      formData = parseFormItems(postmanBody.urlencoded, false);
    } else if (postmanBody.raw) {
      body = postmanBody.raw;
    }
  }

  return {
    body,
    bodyType,
    formData: formData.length > 0 ? formData : undefined,
  };
}

function parseFormItems(items: any, allowFile: boolean) {
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => ({
    id: crypto.randomUUID(),
    key: item.key || "",
    value: item.value || "",
    description: typeof item.description === "string" ? item.description : "",
    type: allowFile && item.type === "file" ? "file" : "text",
    enabled: item.disabled !== true,
  }));
}

function parseExamples(response: any): SavedExample[] {
  if (!Array.isArray(response)) return [];
  return response.map((res: any) => {
    const parsedOrigBody = res.originalRequest?.body
      ? parseBody(res.originalRequest.body)
      : {
          body: "",
          bodyType: undefined as BodyType | undefined,
          formData: undefined as any[] | undefined,
        };
    const originalUrl =
      typeof res.originalRequest?.url === "string"
        ? res.originalRequest.url
        : res.originalRequest?.url?.raw || "";

    return {
      id: crypto.randomUUID(),
      name: res.name || "Example",
      code: res.code || 200,
      status: res.status || "OK",
      body: res.body || "",
      headers: parseExampleHeaders(res.header),
      originalRequest: res.originalRequest
        ? {
            method: res.originalRequest.method || "GET",
            url: originalUrl,
            pathVariables: parsePostmanPathVariables(
              res.originalRequest.url,
              originalUrl,
            ),
            headers: parseExampleHeaders(res.originalRequest.header),
            body: parsedOrigBody.body,
            bodyType: parsedOrigBody.bodyType,
            formData: parsedOrigBody.formData,
          }
        : undefined,
    };
  });
}

function parseExampleHeaders(header: any) {
  if (!Array.isArray(header)) return [];
  return header.map((item: any) => ({
    key: item.key || "",
    value: item.value || "",
    enabled: true,
  }));
}
