import type {
  Collection,
  Folder,
  SavedRequest,
} from "../../contexts/WorkspaceContext";
import { buildPostmanPathVariables } from "../postmanPathVariables";

export function stringifyPostmanCollection(collection: Collection): string {
  const postmanFormat: any = {
    info: {
      name: collection.name,
      description: collection.description,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: collection.items.map(exportItem),
  };

  const colEvents = buildEvents(
    collection.preRequestScript,
    collection.testScript,
  );
  if (colEvents) postmanFormat.event = colEvents;

  const auth = buildAuth(collection.authType, collection.bearerToken);
  if (auth) postmanFormat.auth = auth;

  if (collection.variables && collection.variables.length > 0) {
    postmanFormat.variable = collection.variables.map((variable) => ({
      key: variable.key,
      value: variable.type === "secret" ? "" : variable.value,
      type: "string",
      disabled: !variable.enabled,
    }));
  }

  return JSON.stringify(postmanFormat, null, 2);
}

function exportItem(item: Folder | SavedRequest): any {
  if (item.type === "folder") {
    const folderExport: any = {
      name: item.name,
      description: item.description,
      item: item.items.map(exportItem),
      event: buildEvents(item.preRequestScript, item.testScript),
      auth: buildAuth(item.authType, item.bearerToken),
    };

    if (item.variables && item.variables.length > 0) {
      folderExport.variable = item.variables.map((variable) => ({
        key: variable.key,
        value: variable.type === "secret" ? "" : variable.value,
        type: "string",
        disabled: !variable.enabled,
      }));
    }
    return folderExport;
  }

  return exportRequestItem(item);
}

function exportRequestItem(item: SavedRequest) {
  const cleanHeaders = item.headers.filter(
    (header) => header.key.trim() !== "",
  );
  const { host, path } = parseExportUrlParts(item.url);
  const query =
    item.queryParams && item.queryParams.length > 0
      ? item.queryParams.map((queryParam) => ({
          key: queryParam.key,
          value: queryParam.value,
          description: queryParam.description || undefined,
          disabled: !queryParam.enabled,
        }))
      : undefined;

  return {
    name: item.name,
    event: buildEvents(item.preRequestScript, item.testScript),
    request: {
      method: item.method,
      description: item.description,
      auth: buildAuth(item.authType, item.bearerToken),
      header: cleanHeaders.map((header) => ({
        key: header.key,
        value: header.value,
        description: header.description || undefined,
        type: "text",
      })),
      body: buildPostmanBody(item),
      url: {
        raw: item.url,
        ...(host && host.length > 0 ? { host } : {}),
        ...(path && path.length > 0 ? { path } : {}),
        ...(query && query.length > 0 ? { query } : {}),
        variable: buildPostmanPathVariables(item.pathVariables),
      },
    },
    response: [],
  };
}

function buildEvents(pre: string | undefined, test: string | undefined) {
  const events = [];
  if (pre) {
    events.push({
      listen: "prerequest",
      script: { type: "text/javascript", exec: pre.split("\n") },
    });
  }
  if (test) {
    events.push({
      listen: "test",
      script: { type: "text/javascript", exec: test.split("\n") },
    });
  }
  return events.length > 0 ? events : undefined;
}

function buildAuth(
  type: "inherit" | "none" | "bearer" | undefined,
  token: string | undefined,
) {
  if (type === "none") return { type: "noauth" };
  if (type === "bearer" && token) {
    return {
      type: "bearer",
      bearer: [{ key: "token", value: token, type: "string" }],
    };
  }
  return undefined;
}

function parseExportUrlParts(url: string) {
  let host: string[] | undefined = undefined;
  let path: string[] | undefined = undefined;

  try {
    const parsedUrl = new URL(url);
    host = parsedUrl.host.split(".");
    path = parsedUrl.pathname.split("/").filter(Boolean);
  } catch {
    const withoutProto = (url || "").replace(/^https?:\/\//, "");
    const querySplit = withoutProto.split("?");
    const pathPart = querySplit[0];
    const parts = pathPart.split("/");
    if (parts.length > 0 && parts[0]) {
      host = parts[0].split(".");
      path = parts.slice(1).filter(Boolean);
    }
  }

  return { host, path };
}

function buildPostmanBody(item: SavedRequest) {
  const postmanBody: any = { mode: item.bodyType || "raw" };
  if (item.bodyType === "raw") {
    postmanBody.raw = item.body || "";
  } else if (item.bodyType === "form-data") {
    postmanBody.formdata = (item.formData || []).map((formItem) => ({
      key: formItem.key,
      value: formItem.value,
      type: formItem.type || "text",
      description: formItem.description || undefined,
      disabled: !formItem.enabled,
    }));
  } else if (item.bodyType === "x-www-form-urlencoded") {
    postmanBody.urlencoded = (item.formData || []).map((formItem) => ({
      key: formItem.key,
      value: formItem.value,
      type: "text",
      description: formItem.description || undefined,
      disabled: !formItem.enabled,
    }));
  }
  return postmanBody;
}
